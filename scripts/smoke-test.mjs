// End-to-end smoke test against a running API and the seeded database.
//
//   pnpm db:seed --reset && pnpm start   # (or pnpm dev:server)
//   pnpm test:e2e
//
// It exercises real endpoints (no mocks) and MODIFIES the starter data
// (boss HP, purchases, approvals, a throwaway smoke+<ts>@classroom.local user).
// Run `pnpm db:seed --reset` afterwards to restore it.
const BASE = process.env.BASE ?? 'http://127.0.0.1:4000'
let pass = 0
let fail = 0
const check = (name, cond, extra = '') => {
  if (cond) pass++
  else fail++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`)
}
const call = async (method, path, { token, body, headers } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)

  return { status: res.status, json }
}
const login = async email => {
  const r = await call('POST', '/user/public/login', {
    body: { email, password: '12345678' },
  })

  return r.json?.data?.accessToken
}
const SID = n => `5eed0000-0000-4000-8000-${String(n).padStart(12, '0')}`
const hasPassword = obj => JSON.stringify(obj).includes('"password"')

// ── Auth ──────────────────────────────────────────────────────────────
const teacher = await login('jelegummy.jrs@gmail.com')
const admin = await login('admin@classroom.local')
const s1 = await login('student1@classroom.local')
const s3 = await login('student3@classroom.local')
check('teacher login (jelegummy.jrs@gmail.com / 12345678)', !!teacher)
check('admin + student logins', !!admin && !!s1 && !!s3)
const bad = await call('POST', '/user/public/login', {
  body: { email: 'jelegummy.jrs@gmail.com', password: 'wrongpass' },
})
check('wrong password -> 400', bad.status === 400, bad.status)
const me = await call('GET', '/user/internal/me', { token: teacher })
check(
  'GET /me returns teacher with school',
  me.json?.data?.role === 'TEACHER' && !!me.json?.data?.school?.name,
  JSON.stringify(me.json),
)
check(
  'unauthenticated /me -> 401',
  (await call('GET', '/user/internal/me')).status === 401,
)
check(
  'student cannot list all users -> 403',
  (await call('GET', '/user/internal/all', { token: s1 })).status === 403,
)
const allUsers = await call('GET', '/user/internal/all', { token: admin })
check(
  'admin lists users without password',
  allUsers.status === 200 && !hasPassword(allUsers.json),
)

// ── Registration (was broken by hard-coded school id) ─────────────────
const email = `smoke+${Date.now()}@classroom.local`
const reg = await call('POST', '/user/public/register', {
  body: { email, password: '12345678', firstName: 'Smoke', lastName: 'Test' },
})
check(
  'register new user -> 201',
  reg.json?.statusCode === 201,
  JSON.stringify(reg.json),
)
check('newly registered user can log in', !!(await login(email)))

// ── Classroom ─────────────────────────────────────────────────────────
const rooms = await call('GET', '/classroom/internal/all', { token: s1 })
check(
  'student sees enrolled classrooms',
  rooms.json?.data?.length === 2,
  JSON.stringify(rooms.json)?.slice(0, 200),
)
check('classroom list leaks no password hashes', !hasPassword(rooms.json))
const room = await call('GET', `/classroom/internal/classroom/${SID(10)}`, {
  token: teacher,
})
check(
  'teacher gets DSA classroom w/ members',
  room.json?.data?.users?.length === 4,
)
const newUser = await login(email)
check(
  'non-member cannot read classroom -> 404',
  (
    await call('GET', `/classroom/internal/classroom/${SID(10)}`, {
      token: newUser,
    })
  ).status === 404,
)
const join = await call('POST', '/classroom/internal/join/code', {
  token: newUser,
  body: { code: 'dsa101' },
})
check(
  'join by code (case-insensitive)',
  join.status === 201 || join.json?.statusCode === 200,
  JSON.stringify(join.json)?.slice(0, 200),
)
check('join response leaks no password hashes', !hasPassword(join.json))
const rejoin = await call('POST', '/classroom/internal/join/code', {
  token: newUser,
  body: { code: 'DSA101' },
})
check('re-join -> 400', rejoin.status === 400)
check(
  'student cannot update classroom -> 403',
  (
    await call('PATCH', '/classroom/internal/update', {
      token: s1,
      body: { id: SID(10), name: 'x' },
    })
  ).status === 403,
)

// ── Announcements ─────────────────────────────────────────────────────
const ann = await call('GET', '/announce/internal/all', { token: s1 })
check(
  '/announce/internal/all reachable (route order fix)',
  Array.isArray(ann.json?.data) && ann.json.data.length === 3,
  JSON.stringify(ann.json)?.slice(0, 200),
)
check(
  'student cannot create announcement -> 403',
  (
    await call('POST', '/announce/internal/create', {
      token: s1,
      body: { title: 't', message: 'm', classroomId: SID(10) },
    })
  ).status === 403,
)

// ── Games ─────────────────────────────────────────────────────────────
const games = await call('GET', '/game/internal/all', { token: s1 })
check('game list (school-scoped)', games.json?.data?.length === 1)
check(
  'student cannot end game -> 403',
  (await call('PATCH', `/game/internal/end/${SID(50)}`, { token: s1 }))
    .status === 403,
)
const hpBefore = games.json?.data?.[0]?.classrooms?.[0]?.currentHp
const attacks = await Promise.all(
  Array.from({ length: 10 }, () =>
    call('POST', '/game/internal/attack', {
      token: s1,
      body: { gameId: SID(50), damage: 7 },
    }),
  ),
)
check(
  '10 concurrent attacks all succeed',
  attacks.every(a => a.status === 201),
  attacks.map(a => a.status).join(','),
)
const afterAttack = await call('GET', `/game/internal/game/${SID(50)}`, {
  token: s1,
})
const hpAfter = afterAttack.json?.data?.classrooms?.[0]?.currentHp
check(
  `concurrent attacks lose no damage (${hpBefore} -> ${hpAfter})`,
  hpBefore - hpAfter === 70,
  `${hpBefore} -> ${hpAfter}`,
)
const lb = await call('GET', `/game/internal/leaderboard/${SID(50)}`, {
  token: s1,
})
check('leaderboard', lb.json?.data?.leaderboard?.length >= 2)
check(
  'attack with non-integer damage -> 400',
  (
    await call('POST', '/game/internal/attack', {
      token: s1,
      body: { gameId: SID(50), damage: 1.5 },
    })
  ).status === 400,
)

// ── Attendance (points) ───────────────────────────────────────────────
check(
  'student cannot grant attendance points -> 403',
  (
    await call('POST', '/attendance/internal/game-attendance', {
      token: s1,
      body: {
        activeGameId: SID(50),
        userId: SID(5),
        classroomId: SID(10),
        scoreEarned: 9999,
        status: 'PRESENT',
      },
    })
  ).status === 403,
)

// ── Items ─────────────────────────────────────────────────────────────
const items = await call('GET', '/items/internal/all', { token: s1 })
check('items list', items.json?.data?.length === 2)
check(
  "student cannot spend another user's points -> 403",
  (
    await call('POST', '/items/internal/buy-items', {
      token: s1,
      body: { userId: SID(4), itemId: SID(40), amount: 1 },
    })
  ).status === 403,
)
const buy = await call('POST', '/items/internal/buy-items', {
  token: s3,
  body: { userId: SID(5), itemId: SID(41), amount: 1 },
})
check(
  'student buys item with own points',
  buy.status === 201,
  JSON.stringify(buy.json),
)
const broke = await call('POST', '/items/internal/buy-items', {
  token: s3,
  body: { userId: SID(5), itemId: SID(40), amount: 1000 },
})
check('insufficient points -> 400', broke.status === 400)

// ── Characters ────────────────────────────────────────────────────────
const chars = await call('GET', '/character/internal/all', { token: s1 })
check(
  'characters list leaks no password hashes',
  chars.json?.data?.length === 2 && !hasPassword(chars.json),
)
check(
  'student cannot delete character -> 403',
  (await call('DELETE', `/character/internal/delete/${SID(30)}`, { token: s1 }))
    .status === 403,
)

// ── Tutor ─────────────────────────────────────────────────────────────
const tutors = await call('GET', `/tutor/internal/all?classroomId=${SID(10)}`, {
  token: s1,
})
check(
  'tutor list filtered by classroomId (query fix)',
  tutors.json?.data?.length === 1 && !hasPassword(tutors.json),
)
const tutorsOther = await call(
  'GET',
  `/tutor/internal/all?classroomId=${SID(11)}`,
  { token: s1 },
)
check(
  'tutor list for other classroom is empty',
  tutorsOther.json?.data?.length === 0,
  JSON.stringify(tutorsOther.json)?.slice(0, 120),
)
const active = await call(
  'GET',
  '/tutor/public/channel/000000000000000000/active',
)
check(
  'bot: active tutor lookup by channel',
  active.json?.data?.tutorId === SID(60),
)
check(
  'bot log without secret -> 401',
  (
    await call('POST', `/tutor/public/${SID(60)}/bot/logs`, {
      body: {
        topic: 't',
        summary: 's',
        dataContent: {},
        audioUrl: null,
        voiceChannelName: 'v',
      },
    })
  ).status === 401,
)
const botLog = await call('POST', `/tutor/public/${SID(60)}/bot/logs`, {
  headers: {
    'x-bot-secret': process.env.BOT_API_SECRET || 'super-secret-bot-key',
  },
  body: {
    topic: 'Smoke',
    summary: 'Smoke run',
    audioUrl: null,
    voiceChannelName: 'smoke',
    dataContent: {
      roles: {
        main_speaker: 'Jele Gummy',
        active_participants: ['สมชาย เรียนดี', 'Nobody Here'],
        silent_participants: ['สมชาย เรียนดี'],
      },
    },
  },
})
check(
  'bot log accepted with null audioUrl, unknown names skipped',
  botLog.json?.statusCode === 200 &&
    JSON.stringify(botLog.json?.data?.unmatchedParticipants) ===
      '["Nobody Here"]',
  JSON.stringify(botLog.json)?.slice(0, 300),
)

// ── Assignments / homework ────────────────────────────────────────────
const asg = await call(
  'GET',
  `/assignment/internal/get-assignment/${SID(70)}`,
  { token: s1 },
)
check(
  'student reads assignment without answer key',
  asg.json?.data?.title && asg.json.data.answerFile === undefined,
)
check(
  'student sees only own submissions',
  asg.json?.data?.classrooms?.[0]?.submissions?.every(s => s.userId === SID(3)),
)
const asgT = await call(
  'GET',
  `/assignment/internal/get-assignment/${SID(70)}`,
  { token: teacher },
)
check(
  'teacher sees answer key + all submissions',
  Array.isArray(asgT.json?.data?.answerFile) &&
    asgT.json.data.classrooms[0].submissions.length >= 2,
)
check(
  'student cannot approve submission -> 403',
  (
    await call('POST', '/assignment/internal/approvesubmission', {
      token: s1,
      body: { submissionId: SID(73), isApproved: true },
    })
  ).status === 403,
)
check(
  "student cannot read another's answer history -> 404",
  (
    await call('GET', `/assignment/internal/answerhistory/${SID(73)}`, {
      token: s1,
    })
  ).status === 404,
)
check(
  'submit without bot secret -> 401',
  (
    await call('POST', '/assignment/internal/submit', {
      body: {
        userId: SID(3),
        classroomAssignmentId: SID(71),
        score: 5,
        answerHistory: [],
      },
    })
  ).status === 401,
)
const approve = await call('POST', '/assignment/internal/approvesubmission', {
  token: teacher,
  body: { submissionId: SID(73), isApproved: true },
})
check(
  'teacher approves submission',
  approve.json?.statusCode === 200,
  JSON.stringify(approve.json)?.slice(0, 200),
)
await call('POST', '/assignment/internal/approvesubmission', {
  token: teacher,
  body: { submissionId: SID(73), isApproved: false },
})
const reapprove = await call('POST', '/assignment/internal/approvesubmission', {
  token: teacher,
  body: { submissionId: SID(73), isApproved: true },
})
check(
  're-approval does not award points twice',
  reapprove.json?.message?.result?.pointsAwarded === 0,
  JSON.stringify(reapprove.json)?.slice(0, 200),
)

// ── Error handling ────────────────────────────────────────────────────
const nf = await call('DELETE', `/items/internal/delete/${SID(999)}`, {
  token: teacher,
})
check('Prisma not-found maps to 404 (not 500)', nf.status === 404, nf.status)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
