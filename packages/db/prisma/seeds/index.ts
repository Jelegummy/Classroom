/**
 * Starter data for local development.
 *
 *   pnpm db:seed             # create missing starter records
 *   pnpm db:seed --reset     # delete the starter records, then recreate them
 *
 * Idempotent: every record has a fixed id (or natural unique key) and is
 * upserted, so the script can be re-run safely. Existing users are never
 * modified (their password in particular is left untouched).
 *
 * `--reset` only deletes rows owned by the seed (fixed `5eed…` ids) and data
 * attached to them; nothing else in the database is touched.
 */
import { hashPassword } from '@app/auth/dist/password'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../../src/generated/client'

const DEFAULT_PASSWORD = '12345678'

/** Deterministic, valid UUIDs so re-running the seed updates the same rows. */
const sid = (n: number) =>
  `5eed0000-0000-4000-8000-${n.toString().padStart(12, '0')}`

const ID = {
  teacher: sid(1),
  admin: sid(2),
  student1: sid(3),
  student2: sid(4),
  student3: sid(5),
  classroomDsa: sid(10),
  classroomWeb: sid(11),
  announce1: sid(20),
  announce2: sid(21),
  announce3: sid(22),
  bossBigO: sid(30),
  bossRecursion: sid(31),
  itemAttack: sid(40),
  itemTime: sid(41),
  game: sid(50),
  classroomGame: sid(51),
  tutor: sid(60),
  classroomTutor: sid(61),
  voiceLog: sid(62),
  assignment: sid(70),
  classroomAssignment: sid(71),
  submission1: sid(72),
  submission2: sid(73),
  attGame1: sid(80),
  attGame2: sid(81),
  attTutor1: sid(82),
  attTutor2: sid(83),
  attTutor3: sid(84),
  attHomework: sid(85),
  userItem1: sid(90),
  userItem2: sid(91),
  userItem3: sid(92),
  transaction: sid(100),
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const questions = [
  'อธิบายความหมายของ Big-O notation',
  'Time complexity ของ binary search คืออะไร และเพราะอะไร',
  'loop ซ้อนกันสองชั้นที่วนรอบ n ครั้ง มี complexity เท่าไร',
  'O(n log n) ต่างจาก O(n^2) อย่างไรเมื่อ n มีขนาดใหญ่',
  'ยกตัวอย่างอัลกอริทึมที่มี complexity เป็น O(1)',
]

const answers = [
  'Big-O ใช้บอกอัตราการเติบโตของเวลาหรือหน่วยความจำในกรณีแย่ที่สุดเมื่อขนาดข้อมูล n เพิ่มขึ้น',
  'O(log n) เพราะทุกครั้งที่เปรียบเทียบจะตัดข้อมูลที่ต้องค้นหาออกครึ่งหนึ่ง',
  'O(n^2) เพราะ loop ด้านในทำงาน n ครั้งต่อการวนหนึ่งรอบของ loop ด้านนอก',
  'O(n log n) เติบโตช้ากว่ามาก เมื่อ n ใหญ่ขึ้นจะเร็วกว่า O(n^2) อย่างชัดเจน',
  'การเข้าถึงสมาชิกของ array ด้วย index',
]

/** Removes every record created by this seed (and rows that reference them). */
async function reset() {
  const ids = Object.values(ID)
  const userIds = [ID.teacher, ID.admin, ID.student1, ID.student2, ID.student3]
  const classroomIds = [ID.classroomDsa, ID.classroomWeb]

  await prisma.$transaction([
    prisma.attendance.deleteMany({
      where: {
        OR: [
          { id: { in: ids } },
          { userId: { in: userIds } },
          { activeGame: { classroomId: { in: classroomIds } } },
          { activeTutor: { classroomId: { in: classroomIds } } },
          {
            homeworkSubmission: {
              classroomAssignment: { classroomId: { in: classroomIds } },
            },
          },
        ],
      },
    }),
    prisma.homeworkSubmission.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { classroomAssignment: { classroomId: { in: classroomIds } } },
        ],
      },
    }),
    prisma.userItem.deleteMany({
      where: {
        OR: [{ userId: { in: userIds } }, { itemId: { in: ids } }],
      },
    }),
    prisma.gameOnItem.deleteMany({
      where: { OR: [{ gameId: { in: ids } }, { itemId: { in: ids } }] },
    }),
    prisma.classroomOnGame.deleteMany({
      where: {
        OR: [{ gameId: { in: ids } }, { classroomId: { in: classroomIds } }],
      },
    }),
    prisma.game.deleteMany({
      where: { OR: [{ id: { in: ids } }, { creatorId: { in: userIds } }] },
    }),
    prisma.classroomOnTutor.deleteMany({
      where: {
        OR: [{ tutorId: { in: ids } }, { classroomId: { in: classroomIds } }],
      },
    }),
    prisma.tutor.deleteMany({
      where: { OR: [{ id: { in: ids } }, { hostId: { in: userIds } }] },
    }),
    prisma.classroomOnAssignment.deleteMany({
      where: {
        OR: [
          { assignmentId: { in: ids } },
          { classroomId: { in: classroomIds } },
        ],
      },
    }),
    prisma.assignment.deleteMany({
      where: { OR: [{ id: { in: ids } }, { creatorId: { in: userIds } }] },
    }),
    prisma.classroomAnnounce.deleteMany({
      where: {
        OR: [
          { classroomId: { in: classroomIds } },
          { creatorId: { in: userIds } },
        ],
      },
    }),
    prisma.classroomOnUser.deleteMany({
      where: {
        OR: [
          { classroomId: { in: classroomIds } },
          { userId: { in: userIds } },
        ],
      },
    }),
    prisma.classroom.deleteMany({ where: { id: { in: classroomIds } } }),
    prisma.character.deleteMany({
      where: { OR: [{ id: { in: ids } }, { creatorId: { in: userIds } }] },
    }),
    prisma.item.deleteMany({ where: { id: { in: ids } } }),
    prisma.transaction.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ])
  console.log('✔ Removed existing starter records')
}

async function main() {
  if (process.argv.includes('--reset')) {
    await reset()
  }

  // ── School ────────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { name: 'KMUTNB' },
    update: {},
    create: {
      name: 'KMUTNB',
      address: "King Mongkut's University of Technology North Bangkok",
      phoneNumber: '025552000',
    },
  })

  // ── Users ─────────────────────────────────────────────────────────────
  const password = await hashPassword(DEFAULT_PASSWORD)
  const userSeeds = [
    {
      id: ID.teacher,
      email: 'jelegummy.jrs@gmail.com',
      role: 'TEACHER' as const,
      firstName: 'Jele',
      lastName: 'Gummy',
      teacherId: 'T-0001',
      major: 'Computer Science',
      points: 1000,
    },
    {
      id: ID.admin,
      email: 'admin@classroom.local',
      role: 'ADMIN' as const,
      firstName: 'System',
      lastName: 'Admin',
      points: 0,
    },
    {
      id: ID.student1,
      email: 'student1@classroom.local',
      role: 'STUDENT' as const,
      firstName: 'สมชาย',
      lastName: 'เรียนดี',
      studentId: '6601001',
      major: 'Computer Science',
      points: 150,
    },
    {
      id: ID.student2,
      email: 'student2@classroom.local',
      role: 'STUDENT' as const,
      firstName: 'สมหญิง',
      lastName: 'ตั้งใจ',
      studentId: '6601002',
      major: 'Computer Science',
      points: 80,
    },
    {
      id: ID.student3,
      email: 'student3@classroom.local',
      role: 'STUDENT' as const,
      firstName: 'Alex',
      lastName: 'Turner',
      studentId: '6601003',
      major: 'Information Technology',
      points: 20,
    },
  ]

  const users: Record<string, string> = {}
  for (const u of userSeeds) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    const user =
      existing ??
      (await prisma.user.create({
        data: { ...u, password, schoolId: school.id },
      }))
    if (existing) {
      console.log(`  • ${u.email} already exists — left unchanged`)
    }
    users[u.id] = user.id
  }
  const teacher = users[ID.teacher]
  const admin = users[ID.admin]
  const s1 = users[ID.student1]
  const s2 = users[ID.student2]
  const s3 = users[ID.student3]

  // ── Classrooms & enrollment ───────────────────────────────────────────
  const classrooms = [
    {
      id: ID.classroomDsa,
      name: 'Data Structures & Algorithms',
      title: 'โครงสร้างข้อมูลและอัลกอริทึม (ภาคเรียนที่ 2/2569)',
      code: 'DSA101',
      members: [
        [teacher, 30],
        [s1, 40],
        [s2, 25],
        [s3, 5],
      ] as const,
    },
    {
      id: ID.classroomWeb,
      name: 'Web Programming',
      title: 'การเขียนโปรแกรมเว็บ',
      code: 'WEB201',
      members: [
        [teacher, 10],
        [s1, 0],
        [s3, 0],
      ] as const,
    },
  ]

  for (const c of classrooms) {
    await prisma.classroom.upsert({
      where: { id: c.id },
      update: { name: c.name, title: c.title },
      create: {
        id: c.id,
        name: c.name,
        title: c.title,
        code: c.code,
        hoverImage: `https://placehold.co/800x300?text=${encodeURIComponent(c.code)}`,
        schoolId: school.id,
      },
    })
    for (const [userId, score] of c.members) {
      await prisma.classroomOnUser.upsert({
        where: { userId_classroomId: { userId, classroomId: c.id } },
        update: {},
        create: { userId, classroomId: c.id, score, isRewarded: true },
      })
    }
  }

  // ── Announcements ─────────────────────────────────────────────────────
  const announces = [
    {
      id: ID.announce1,
      classroomId: ID.classroomDsa,
      title: 'ยินดีต้อนรับสู่รายวิชา',
      message:
        'สวัสดีทุกคน! คาบแรกเราจะเริ่มจากเรื่อง Time Complexity และ Big-O notation',
    },
    {
      id: ID.announce2,
      classroomId: ID.classroomDsa,
      title: 'การบ้านชุดที่ 1',
      message:
        'การบ้าน Time Complexity เปิดให้ส่งแล้ว ส่งผ่านระบบตรวจการบ้านด้วย AI ภายใน 7 วัน',
    },
    {
      id: ID.announce3,
      classroomId: ID.classroomWeb,
      title: 'เตรียมเครื่องให้พร้อม',
      message: 'กรุณาติดตั้ง Node.js 22 และ VS Code ก่อนเข้าคาบแรก',
    },
  ]
  for (const a of announces) {
    await prisma.classroomAnnounce.upsert({
      where: { id: a.id },
      update: { title: a.title, message: a.message },
      create: { ...a, creatorId: teacher },
    })
  }

  // ── Characters (bosses) & items ───────────────────────────────────────
  const characters = [
    {
      id: ID.bossBigO,
      bossName: 'Big-O Dragon',
      pointBoss: 100,
      maxHp: 500,
      timeLimit: 300,
      description: 'มังกรผู้พิทักษ์ความซับซ้อนของอัลกอริทึม',
      modelUrl: '/models/pumpkin.glb',
      imageUrl: 'https://placehold.co/400x400?text=Big-O+Dragon',
    },
    {
      id: ID.bossRecursion,
      bossName: 'Recursion Golem',
      pointBoss: 60,
      maxHp: 300,
      timeLimit: 180,
      description: 'ยักษ์หินที่เรียกตัวเองซ้ำไม่รู้จบ',
      modelUrl: '/models/pumpkin.glb',
      imageUrl: 'https://placehold.co/400x400?text=Recursion+Golem',
    },
  ]
  for (const ch of characters) {
    await prisma.character.upsert({
      where: { id: ch.id },
      update: {},
      create: { ...ch, creatorId: admin },
    })
  }

  const items = [
    {
      id: ID.itemAttack,
      name: 'Power Strike',
      description: 'เพิ่มพลังโจมตีบอส',
      price: 20,
      effectValue: 10,
      type: 'ATTACK_BOOST' as const,
      imageUrl: 'https://placehold.co/150x150?text=ATK',
    },
    {
      id: ID.itemTime,
      name: 'Time Freeze',
      description: 'เพิ่มเวลาในการต่อสู้',
      price: 15,
      effectValue: 30,
      type: 'TIME_EXTEND' as const,
      imageUrl: 'https://placehold.co/150x150?text=TIME',
    },
  ]
  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    })
  }

  // ── Game session ──────────────────────────────────────────────────────
  const maxHpBoss = 500
  const damage = [
    { id: ID.attGame1, userId: s1, damageDealt: 50 },
    { id: ID.attGame2, userId: s2, damageDealt: 30 },
  ]
  await prisma.game.upsert({
    where: { id: ID.game },
    update: {},
    create: {
      id: ID.game,
      name: 'Boss Battle: Big-O',
      description: 'ตอบคำถามให้ถูกเพื่อโจมตีมังกร Big-O',
      imageUrl: 'https://placehold.co/600x300?text=Boss+Battle',
      timeLimit: 300,
      damageBoost: 0,
      maxHpBoss,
      status: 'WAITING',
      isActive: true,
      creatorId: teacher,
      characterId: ID.bossBigO,
    },
  })
  for (const itemId of [ID.itemAttack, ID.itemTime]) {
    await prisma.gameOnItem.upsert({
      where: { gameId_itemId: { gameId: ID.game, itemId } },
      update: {},
      create: { gameId: ID.game, itemId },
    })
  }
  await prisma.classroomOnGame.upsert({
    where: {
      classroomId_gameId: { classroomId: ID.classroomDsa, gameId: ID.game },
    },
    update: {},
    create: {
      id: ID.classroomGame,
      classroomId: ID.classroomDsa,
      gameId: ID.game,
      isActive: true,
      currentHp: maxHpBoss - damage.reduce((sum, d) => sum + d.damageDealt, 0),
    },
  })
  const classroomGame = await prisma.classroomOnGame.findUniqueOrThrow({
    where: {
      classroomId_gameId: { classroomId: ID.classroomDsa, gameId: ID.game },
    },
  })
  for (const d of damage) {
    await prisma.attendance.upsert({
      where: {
        userId_activeGameId: {
          userId: d.userId,
          activeGameId: classroomGame.id,
        },
      },
      update: {},
      create: {
        id: d.id,
        userId: d.userId,
        activeGameId: classroomGame.id,
        damageDealt: d.damageDealt,
        status: 'PRESENT',
      },
    })
  }

  // ── Inventories ───────────────────────────────────────────────────────
  const inventory = [
    { id: ID.userItem1, userId: s1, itemId: ID.itemAttack, amount: 2 },
    { id: ID.userItem2, userId: s1, itemId: ID.itemTime, amount: 1 },
    { id: ID.userItem3, userId: s2, itemId: ID.itemAttack, amount: 1 },
  ]
  for (const inv of inventory) {
    await prisma.userItem.upsert({
      where: {
        user_item_unique: { userId: inv.userId, itemId: inv.itemId },
      },
      update: {},
      create: inv,
    })
  }

  // ── Tutoring session (Discord bot) ────────────────────────────────────
  await prisma.tutor.upsert({
    where: { id: ID.tutor },
    update: {},
    create: {
      id: ID.tutor,
      name: 'ติวสรุป Big-O ก่อนสอบ',
      // Replace with a real Discord voice channel id to use the bot.
      discordChannelId: '000000000000000000',
      inviteLink: 'https://discord.gg/your-invite',
      dataContent: {},
      hostId: teacher,
    },
  })
  await prisma.classroomOnTutor.upsert({
    where: { id: ID.classroomTutor },
    update: {},
    create: {
      id: ID.classroomTutor,
      classroomId: ID.classroomDsa,
      tutorId: ID.tutor,
    },
  })
  await prisma.tutorVoiceLog.upsert({
    where: { id: ID.voiceLog },
    update: {},
    create: {
      id: ID.voiceLog,
      tutorId: ID.tutor,
      voiceChannelName: 'ห้องติว DSA',
      topic: 'Big-O notation',
      summary:
        'ทบทวนความหมายของ Big-O และเปรียบเทียบ O(log n), O(n), O(n log n) และ O(n^2) พร้อมตัวอย่างโค้ด',
      dataContent: {
        roles: {
          main_speaker: 'Jele Gummy',
          active_participants: ['สมชาย เรียนดี', 'สมหญิง ตั้งใจ'],
          silent_participants: ['Alex Turner'],
        },
        participants: ['สมชาย เรียนดี', 'สมหญิง ตั้งใจ', 'Alex Turner'],
        transcript: [
          {
            speaker: 'Jele Gummy',
            start: 0,
            end: 6.5,
            text: 'วันนี้เราจะทบทวนเรื่อง Big-O กันนะครับ',
          },
          {
            speaker: 'สมชาย เรียนดี',
            start: 7,
            end: 11.2,
            text: 'binary search เป็น O(log n) ใช่ไหมครับ',
          },
          {
            speaker: 'Jele Gummy',
            start: 11.5,
            end: 16,
            text: 'ถูกต้องครับ เพราะแบ่งข้อมูลครึ่งหนึ่งทุกครั้ง',
          },
        ],
      },
    },
  })
  const tutorAttendance = [
    { id: ID.attTutor1, userId: s1, scoreEarned: 3 },
    { id: ID.attTutor2, userId: s2, scoreEarned: 3 },
    { id: ID.attTutor3, userId: s3, scoreEarned: 1 },
  ]
  for (const a of tutorAttendance) {
    await prisma.attendance.upsert({
      where: {
        userId_activeTutorId: {
          userId: a.userId,
          activeTutorId: ID.classroomTutor,
        },
      },
      update: {},
      create: { ...a, activeTutorId: ID.classroomTutor, status: 'PRESENT' },
    })
  }

  // ── Assignment (AI homework checking) ─────────────────────────────────
  await prisma.assignment.upsert({
    where: { id: ID.assignment },
    update: {},
    create: {
      id: ID.assignment,
      title: 'การบ้าน Time Complexity',
      description: 'อธิบายแนวคิด Big-O และวิเคราะห์ complexity ของโค้ดตัวอย่าง',
      // Matches apps/assignment-bot/data/timecomplexity.pdf
      filePdf: 'timecomplexity.pdf',
      status: 'PUBLISHED',
      chatHistory: questions.map(content => ({ role: 'assistant', content })),
      answerFile: questions.map((question, i) => ({
        question,
        answer: answers[i],
      })),
      gradingCriteria: 'ตอบถูกอย่างน้อย 4 จาก 5 ข้อถือว่าผ่าน',
      creatorId: teacher,
    },
  })
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)
  await prisma.classroomOnAssignment.upsert({
    where: { id: ID.classroomAssignment },
    update: {},
    create: {
      id: ID.classroomAssignment,
      classroomId: ID.classroomDsa,
      assignmentId: ID.assignment,
      dueDate,
    },
  })

  const history = (correct: boolean[]) =>
    questions.flatMap((q, i) => [
      { role: 'bot', content: q },
      {
        role: 'student',
        content: correct[i] ? answers[i] : 'ไม่แน่ใจครับ',
        expected: answers[i],
        is_correct: correct[i],
        reason: correct[i] ? 'ใจความตรงกับเฉลย' : 'ไม่ได้ตอบประเด็นสำคัญ',
      },
    ])

  await prisma.homeworkSubmission.upsert({
    where: { id: ID.submission1 },
    update: {},
    create: {
      id: ID.submission1,
      userId: s1,
      classroomAssignmentId: ID.classroomAssignment,
      score: 4,
      isApproved: true,
      aiFeedback: 'เข้าใจแนวคิดหลักได้ดี ควรทบทวนเรื่อง O(n log n) เพิ่มเติม',
      answerHistory: history([true, true, true, false, true]),
    },
  })
  await prisma.homeworkSubmission.upsert({
    where: { id: ID.submission2 },
    update: {},
    create: {
      id: ID.submission2,
      userId: s2,
      classroomAssignmentId: ID.classroomAssignment,
      score: 2,
      isApproved: false,
      answerHistory: history([true, false, true, false, false]),
    },
  })
  await prisma.attendance.upsert({
    where: {
      userId_homeworkSubmissionId: {
        userId: s1,
        homeworkSubmissionId: ID.submission1,
      },
    },
    update: {},
    create: {
      id: ID.attHomework,
      userId: s1,
      homeworkSubmissionId: ID.submission1,
      scoreEarned: 4,
      status: 'PRESENT',
    },
  })

  // ── Point top-up history ──────────────────────────────────────────────
  await prisma.transaction.upsert({
    where: { referenceId: 'SEED-TXN-0001' },
    update: {},
    create: {
      id: ID.transaction,
      userId: teacher,
      amount: 100,
      tokensPoints: 1010,
      referenceId: 'SEED-TXN-0001',
      status: 'SUCCESS',
    },
  })

  console.log('\n✔ Seed complete')
  console.table([
    { email: 'jelegummy.jrs@gmail.com', role: 'TEACHER' },
    { email: 'admin@classroom.local', role: 'ADMIN' },
    { email: 'student1@classroom.local', role: 'STUDENT' },
    { email: 'student2@classroom.local', role: 'STUDENT' },
    { email: 'student3@classroom.local', role: 'STUDENT' },
  ])
  console.log(`Password for new seed accounts: ${DEFAULT_PASSWORD}`)
  console.log('Classroom join codes: DSA101, WEB201')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
