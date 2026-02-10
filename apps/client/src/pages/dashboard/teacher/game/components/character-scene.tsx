import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
  Center,
} from '@react-three/drei'
import { Suspense } from 'react'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)

  return (
    <Center position={[0, -0.28, 0]}>
      <primitive object={scene} scale={2.5} />
    </Center>
  )
}

export default function CharacterScene({ url }: { url: string | null }) {
  return (
    <div className="h-full w-full">
      {/* ปรับ y ของ camera ลงมาหน่อย (จาก 1 เป็น 0.5 หรือ 0) เพื่อให้มองตรงๆ */}
      <Canvas camera={{ position: [0, 0.5, 4], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Environment preset="city" />

        <Suspense fallback={null}>
          {url && <Model url={url} key={url} />}
        </Suspense>

        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          // ตั้งค่า min และ max ให้เท่ากันที่ 90 องศา (Math.PI / 2)
          // เพื่อล็อคแกน Y ไม่ให้ขยับขึ้นลง
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
