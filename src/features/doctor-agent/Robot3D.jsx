import { ContactShadows, Float, OrbitControls, RoundedBox, Sparkles, Trail } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'

// Per-state color theme — eyes/mouth/antenna/ring all shift palette so the
// robot visibly "feels" different while thinking vs. idly waiting vs. talking.
// 'off' (red) is the powered-down look before the robot has booted up.
const STATE_THEME = {
  off: { glow: '#ff3b3b', ring: '#ff3b3b', rim: '#ff6b6b' },
  idle: { glow: '#00f0a0', ring: '#00b894', rim: '#5eead4' },
  thinking: { glow: '#7c9cff', ring: '#5b6cff', rim: '#a78bfa' },
  talking: { glow: '#00f0a0', ring: '#00d68f', rim: '#34d399' },
}

// Procedural 3D robot — no external model file, just primitives animated with
// useFrame. `state` drives the look: 'off' (red standby glow, before boot),
// 'idle' (green, gentle bob + occasional blink), 'thinking' (faster bob,
// cool-blue pulsing antenna while a backend call is in flight) or 'talking'
// (mouth bar pulses, eyes glow brighter) while the robot's speech bubble text
// is on screen.
function RobotModel({ state }) {
  const theme = STATE_THEME[state] || STATE_THEME.idle

  const groupRef = useRef(null)
  const headRef = useRef(null)
  const eyeLeftRef = useRef(null)
  const eyeRightRef = useRef(null)
  const mouthRef = useRef(null)
  const antennaTipRef = useRef(null)
  const earLeftRef = useRef(null)
  const earRightRef = useRef(null)
  const armLeftRef = useRef(null)
  const armRightRef = useRef(null)
  const ringInnerRef = useRef(null)
  const ringOuterRef = useRef(null)
  const blinkClock = useRef(0)

  useFrame((_, delta) => {
    const t = performance.now() / 1000
    const bobSpeed = state === 'thinking' ? 3.2 : 1.6
    const bobAmplitude = state === 'thinking' ? 0.08 : 0.05

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * bobSpeed) * bobAmplitude
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.16
    }

    // Curious head tilt, phase-shifted from the body yaw so the motion reads
    // as independent "looking around" rather than the whole robot swiveling.
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 0.8 + 1.2) * 0.06
      headRef.current.rotation.z = Math.sin(t * 0.5) * 0.04
    }

    // Ears flutter gently, phase-shifted left vs. right for an organic feel.
    if (earLeftRef.current) earLeftRef.current.rotation.z = Math.sin(t * 1.4) * 0.08
    if (earRightRef.current) earRightRef.current.rotation.z = -Math.sin(t * 1.4 + 0.6) * 0.08

    // Arms sway gently at the shoulder, phase-shifted so they don't move
    // in lockstep — reads as idle breathing rather than a robotic mirror.
    if (armLeftRef.current) armLeftRef.current.rotation.x = Math.sin(t * 0.9) * 0.05
    if (armRightRef.current) armRightRef.current.rotation.x = Math.sin(t * 0.9 + 1.4) * 0.05

    // Blink: close eyes for a short burst every ~4s, independent of state.
    blinkClock.current += delta
    const blinkPhase = blinkClock.current % 4
    const blinking = blinkPhase > 3.85
    const eyeScaleY = blinking ? 0.1 : 1
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = eyeScaleY
    if (eyeRightRef.current) eyeRightRef.current.scale.y = eyeScaleY

    if (mouthRef.current) {
      mouthRef.current.scale.y = state === 'talking' ? 0.6 + Math.abs(Math.sin(t * 10)) * 0.8 : 0.6
    }

    if (antennaTipRef.current) {
      const pulseSpeed = state === 'thinking' ? 8 : 2
      const intensity = state === 'thinking' ? 1.8 : 1
      antennaTipRef.current.material.emissiveIntensity = intensity + Math.sin(t * pulseSpeed) * 0.6
    }

    // Holographic rings spin in opposite directions, faster while thinking.
    const ringSpeed = state === 'thinking' ? 1.8 : 0.6
    if (ringInnerRef.current) ringInnerRef.current.rotation.z += delta * ringSpeed
    if (ringOuterRef.current) ringOuterRef.current.rotation.z -= delta * ringSpeed * 0.5
  })

  return (
    <group ref={groupRef}>
      {/* Holographic ground rings */}
      <mesh ref={ringInnerRef} position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.025, 16, 64]} />
        <meshStandardMaterial color={theme.ring} emissive={theme.ring} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh ref={ringOuterRef} position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.012, 16, 64]} />
        <meshStandardMaterial color={theme.ring} emissive={theme.ring} emissiveIntensity={1} toneMapped={false} transparent opacity={0.5} />
      </mesh>

      {/* Body */}
      <RoundedBox args={[1.1, 1.3, 0.9]} radius={0.22} position={[0, -0.85, 0]}>
        <meshStandardMaterial color="#f5fbf5" metalness={0.35} roughness={0.35} />
      </RoundedBox>

      {/* Doctor's white coat (lab coat) over the chassis, open collar, with
          a stethoscope draped around the neck — the realistic "doctor"
          read, rather than a generic medical-icon cross. */}
      <group position={[0, -0.85, 0]}>
        <RoundedBox args={[0.92, 1.15, 0.06]} radius={0.08} position={[0, 0, 0.46]}>
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.55} />
        </RoundedBox>
        {/* Open lapel collar */}
        <mesh position={[-0.16, 0.52, 0.49]} rotation={[0, 0, 0.55]}>
          <boxGeometry args={[0.22, 0.09, 0.04]} />
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.55} />
        </mesh>
        <mesh position={[0.16, 0.52, 0.49]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.22, 0.09, 0.04]} />
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.55} />
        </mesh>

        {/* Stethoscope: a loop around the neck with two tubes converging on
            a chest piece, sitting on top of the coat. */}
        <mesh position={[0, 0.58, 0.42]} rotation={[1.15, 0, 0]}>
          <torusGeometry args={[0.16, 0.022, 12, 32]} />
          <meshStandardMaterial color="#1f2326" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[-0.1, 0.32, 0.5]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
          <meshStandardMaterial color="#1f2326" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.32, 0.5]} rotation={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
          <meshStandardMaterial color="#1f2326" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.025, 20]} />
          <meshStandardMaterial color="#2b2f33" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>

      <group ref={headRef} position={[0, 0.25, 0]}>
        {/* Head */}
        <RoundedBox args={[1.15, 0.95, 0.95]} radius={0.3}>
          <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.25} />
        </RoundedBox>

        {/* Visor */}
        <RoundedBox args={[0.85, 0.45, 0.3]} radius={0.15} position={[0, 0.03, 0.42]}>
          <meshStandardMaterial color="#0f1f17" metalness={0.6} roughness={0.2} />
        </RoundedBox>

        {/* Eyes */}
        <mesh ref={eyeLeftRef} position={[-0.22, 0.05, 0.58]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={theme.glow} emissive={theme.glow} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.22, 0.05, 0.58]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={theme.glow} emissive={theme.glow} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.2, 0.59]}>
          <boxGeometry args={[0.32, 0.05, 0.05]} />
          <meshStandardMaterial color={theme.glow} emissive={theme.glow} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Antenna, with a light trail following the tip as the head bobs */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
        <meshStandardMaterial color="#9fb3a9" metalness={0.7} roughness={0.3} />
      </mesh>
      <Trail width={1.4} length={4} color={theme.glow} attenuation={(t2) => t2 * t2} decay={2}>
        <mesh ref={antennaTipRef} position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={theme.ring} emissive={theme.ring} emissiveIntensity={1} toneMapped={false} />
        </mesh>
      </Trail>

      {/* Ears / side panels */}
      <RoundedBox ref={earLeftRef} args={[0.12, 0.4, 0.4]} radius={0.05} position={[-0.62, 0.25, 0]}>
        <meshStandardMaterial color="#bccac1" metalness={0.4} roughness={0.4} />
      </RoundedBox>
      <RoundedBox ref={earRightRef} args={[0.12, 0.4, 0.4]} radius={0.05} position={[0.62, 0.25, 0]}>
        <meshStandardMaterial color="#bccac1" metalness={0.4} roughness={0.4} />
      </RoundedBox>

      {/* Arms with white coat sleeves, hanging at the shoulders — this is
          what actually sells "wearing" the coat, rather than a flat panel
          stuck on the chest. */}
      <group position={[-0.62, -0.35, 0.05]} ref={armLeftRef}>
        <mesh position={[0, -0.32, 0]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.1, 0.085, 0.62, 12]} />
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.55} />
        </mesh>
        <mesh position={[-0.04, -0.66, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#bccac1" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
      <group position={[0.62, -0.35, 0.05]} ref={armRightRef}>
        <mesh position={[0, -0.32, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.1, 0.085, 0.62, 12]} />
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.55} />
        </mesh>
        <mesh position={[0.04, -0.66, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#bccac1" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
    </group>
  )
}

export function Robot3D({ state = 'idle', height = 240 }) {
  const theme = useMemo(() => STATE_THEME[state] || STATE_THEME.idle, [state])

  return (
    <div
      style={{ height }}
      className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#1a2e26_0%,#0b1410_70%)]"
    >
      <Canvas camera={{ position: [0, 0.3, 3.4], fov: 40 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 4]} intensity={1.1} />
          <pointLight color={theme.glow} intensity={0.8} position={[-2, -0.5, 2]} />
          <pointLight color={theme.rim} intensity={0.6} position={[2, 1.5, -2]} />

          <Sparkles color={theme.glow} count={36} opacity={0.7} scale={[2.6, 2.6, 2.6]} size={2.5} speed={0.35} />

          <Float floatIntensity={0.6} rotationIntensity={0.25} speed={state === 'thinking' ? 2.5 : 1.2}>
            <RobotModel state={state} />
          </Float>

          <ContactShadows blur={2.4} far={2} opacity={0.45} position={[0, -1.56, 0]} scale={4} />

          {/* No autoRotate — the robot must always face the patient, never
              show its back. A small drag range is still allowed for a bit of
              interactivity, clamped well short of ever reaching the back. */}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            maxAzimuthAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.9}
            minAzimuthAngle={-Math.PI / 6}
            minPolarAngle={Math.PI / 2.6}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
