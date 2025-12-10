import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import * as THREE from 'three'

// 플레이어 컴포넌트
function Player({ position, attackRange }) {
  const meshRef = useRef()
  
  return (
    <group ref={meshRef} position={position}>
      {/* 공격 범위 표시 (반투명 구) */}
      <mesh>
        <sphereGeometry args={[attackRange, 16, 16]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* 플레이어 본체 */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.3} />
      </mesh>
      {/* 플레이어 눈 */}
      <mesh position={[-0.3, 0.3, 0.6]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.3, 0.3, 0.6]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
    </group>
  )
}

// 모닥불 컴포넌트
function Bonfire({ position, hp, maxHp }) {
  const fireRef = useRef()
  
  useFrame((state) => {
    if (fireRef.current) {
      fireRef.current.rotation.y += 0.01
      fireRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })
  
  return (
    <group position={position}>
      {/* 모닥불 조명 효과 */}
      <pointLight intensity={2} distance={10} color="#ff9640" />
      <pointLight intensity={1} distance={15} color="#ffaa00" />
      
      {/* 모닥불 본체 */}
      <mesh ref={fireRef}>
        <cylinderGeometry args={[1.5, 1.5, 0.5, 16]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* 불꽃 */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.7, 1.5, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
      </mesh>
      
      {/* HP 바 */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[3, 0.3, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 2.5, 0.05]}>
        <boxGeometry args={[3 * (hp / maxHp), 0.3, 0.1]} />
        <meshStandardMaterial color={hp > 3 ? "#22c55e" : "#ef4444"} />
      </mesh>
    </group>
  )
}

// 좀비 컴포넌트
function Zombie({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      {/* 좀비 눈 */}
      <mesh position={[-0.25, 0.2, 0.7]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      <mesh position={[0.25, 0.2, 0.7]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
    </group>
  )
}

// 총알 컴포넌트
function Bullet({ position, color, size }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size || 0.2, 8, 8]} />
      <meshStandardMaterial color={color || "#fbbf24"} emissive={color || "#fbbf24"} emissiveIntensity={1} />
    </mesh>
  )
}

// 무기 아이템 컴포넌트
function WeaponItem({ position, weaponType }) {
  const itemRef = useRef()
  
  useFrame((state) => {
    if (itemRef.current) {
      itemRef.current.rotation.y += 0.02
      itemRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2
    }
  })
  
  const colors = {
    basic: { main: '#fbbf24', glow: '#fbbf24' },
    fire: { main: '#ef4444', glow: '#f97316' },
    ice: { main: '#60a5fa', glow: '#3b82f6' },
    lightning: { main: '#a855f7', glow: '#9333ea' }
  }
  
  const color = colors[weaponType] || colors.basic
  
  return (
    <group ref={itemRef} position={position}>
      <pointLight intensity={1.5} distance={5} color={color.glow} />
      <mesh>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={color.main} emissive={color.main} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.3, 0.5, 8]} />
        <meshStandardMaterial color={color.glow} emissive={color.glow} emissiveIntensity={1} />
      </mesh>
    </group>
  )
}

// 파티클 컴포넌트
function Particle({ position, life, maxLife }) {
  const opacity = life / maxLife
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial color="#4ade80" transparent opacity={opacity} />
    </mesh>
  )
}

// 지면 컴포넌트
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#1a1a2e" />
    </mesh>
  )
}

// 게임 월드 컴포넌트
function GameWorld({ gameRef, forceUpdate }) {
  useFrame(() => {
    const g = gameRef.current
    if (g.gameStarted && !g.gameOver && g.waveDelay === 0) {
      // 강제 리렌더링을 위해 약간의 지연 후 업데이트
      if (forceUpdate) {
        requestAnimationFrame(() => forceUpdate())
      }
    }
  })
  
  const g = gameRef.current
  
  const weaponColors = {
    basic: '#fbbf24',
    fire: '#ef4444',
    ice: '#60a5fa',
    lightning: '#a855f7'
  }
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      <Ground />
      
      {g.gameStarted && !g.gameOver && (
        <>
          <Player position={[g.player.x, 1, g.player.z]} attackRange={g.player.attackRange} />
          <Bonfire position={[g.bonfire.x, 0, g.bonfire.z]} hp={g.bonfire.hp} maxHp={g.bonfire.maxHp} />
          
          {g.zombies.map((zombie, idx) => (
            <Zombie 
              key={`zombie-${idx}`}
              position={[zombie.x, 0.9, zombie.z]} 
              rotation={[0, Math.atan2(g.bonfire.x - zombie.x, g.bonfire.z - zombie.z), 0]}
            />
          ))}
          
          {g.bullets.map((bullet, idx) => (
            <Bullet 
              key={`bullet-${idx}`} 
              position={[bullet.x, 0.5, bullet.z]} 
              color={weaponColors[bullet.weaponType] || weaponColors.basic}
              size={bullet.size || 0.2}
            />
          ))}
          
          {g.weaponItems && g.weaponItems.map((item, idx) => (
            <WeaponItem 
              key={`weapon-${idx}`}
              position={[item.x, 0, item.z]}
              weaponType={item.type}
            />
          ))}
          
          {g.particles.map((particle, idx) => (
            <Particle 
              key={`particle-${idx}`}
              position={[particle.x, 0.3, particle.z]} 
              life={particle.life} 
              maxLife={particle.maxLife}
            />
          ))}
        </>
      )}
      
      {g.waveDelay > 0 && (
        <Text
          position={[0, 5, 0]}
          fontSize={2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          웨이브 {g.wave} 시작!
        </Text>
      )}
    </>
  )
}

// 컨트롤러 컴포넌트
function MovementController({ position, onMove, onEnd, disabled }) {
  const [isActive, setIsActive] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const controllerRef = useRef(null)
  
  const handleStart = (clientX, clientY) => {
    if (disabled) return
    setIsActive(true)
    const rect = controllerRef.current.getBoundingClientRect()
    setStartPos({
      x: clientX - rect.left,
      y: clientY - rect.top
    })
  }
  
  const handleMove = (clientX, clientY) => {
    if (!isActive || disabled) return
    const rect = controllerRef.current.getBoundingClientRect()
    const currentX = clientX - rect.left
    const currentY = clientY - rect.top
    
    const dx = currentX - startPos.x
    const dy = currentY - startPos.y
    
    // 정규화된 방향 벡터 전달
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > 5) {
      onMove({
        x: dx / length,
        z: dy / length
      })
    }
    
    setStartPos({ x: currentX, y: currentY })
  }
  
  const handleEnd = () => {
    setIsActive(false)
    if (onEnd) onEnd()
  }
  
  if (!position) return null
  
  return (
    <div
      ref={controllerRef}
      style={{
        position: 'absolute',
        left: `${position.x - 75}px`,
        top: `${position.y - 75}px`,
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(96, 165, 250, 0.2)',
        border: '2px solid rgba(96, 165, 250, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        touchAction: 'none',
        userSelect: 'none',
        opacity: disabled ? 0.3 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        zIndex: 15
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        e.preventDefault()
        handleStart(e.touches[0].clientX, e.touches[0].clientY)
      }}
      onTouchMove={(e) => {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }}
      onTouchEnd={handleEnd}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isActive ? 'rgba(96, 165, 250, 0.8)' : 'rgba(96, 165, 250, 0.5)',
          transition: isActive ? 'none' : 'all 0.2s',
          transform: isActive ? 'scale(1.2)' : 'scale(1)'
        }}
      />
    </div>
  )
}

// 무기 타입 정의
const WEAPON_TYPES = {
  basic: { name: '기본', damage: 1, color: '#fbbf24', cooldown: 20 },
  fire: { name: '화염', damage: 2, color: '#ef4444', cooldown: 15 },
  ice: { name: '얼음', damage: 2, color: '#60a5fa', cooldown: 15 },
  lightning: { name: '번개', damage: 3, color: '#a855f7', cooldown: 12 }
}

export default function BonfireDefense3D() {
  const gameRef = useRef({
    player: { x: 0, z: 0, speed: 0.15, attackRange: 8 },
    bonfire: { x: 0, z: 0, hp: 10, maxHp: 10 },
    zombies: [],
    bullets: [],
    particles: [],
    weaponItems: [],
    weapons: [{ type: 'basic', level: 1, cooldown: 0 }], // 보유 무기 목록 (각 무기별 쿨다운)
    score: 0,
    wave: 1,
    zombiesKilled: 0,
    zombiesPerWave: 5,
    gameOver: false,
    gameStarted: false,
    moveDirection: null,
    autoCombat: false, // 자동 전투 모드
    targetZombie: null, // 자동 전투 타겟 좀비
    lastTime: 0,
    spawnTimer: 0,
    waveDelay: 0,
    weaponDropTimer: 0
  })
  
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [bonfireHp, setBonfireHp] = useState(10)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [waveDelay, setWaveDelay] = useState(0)
  const [controllerPosition, setControllerPosition] = useState(null)
  const [autoCombat, setAutoCombat] = useState(false)
  const [, forceUpdate] = useState(0)
  
  const triggerUpdate = useCallback(() => {
    forceUpdate(prev => prev + 1)
  }, [])
  
  const spawnZombie = useCallback((g) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 18 + Math.random() * 2
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance
    
    g.zombies.push({
      x, z, hp: 2 + Math.floor(g.wave / 2),
      speed: 0.03 + g.wave * 0.005
    })
  }, [])
  
  const startGame = () => {
    const g = gameRef.current
    g.player = { x: 0, z: 5, speed: 0.15, attackRange: 8 }
    g.bonfire = { x: 0, z: 0, hp: 10, maxHp: 10 }
    g.zombies = []
    g.bullets = []
    g.particles = []
    g.weaponItems = []
    g.weapons = [{ type: 'basic', level: 1, cooldown: 0 }]
    g.score = 0
    g.wave = 1
    g.zombiesKilled = 0
    g.zombiesPerWave = 5
    g.gameOver = false
    g.gameStarted = true
    g.moveDirection = null
    g.autoCombat = false
    g.targetZombie = null
    g.spawnTimer = 0
    g.waveDelay = 60
    g.weaponDropTimer = 0
    
    setScore(0)
    setWave(1)
    setBonfireHp(10)
    setGameOver(false)
    setGameStarted(true)
    setWaveDelay(60)
    setControllerPosition(null)
    setAutoCombat(false)
  }
  
  const toggleAutoCombat = useCallback(() => {
    const g = gameRef.current
    g.autoCombat = !g.autoCombat
    g.targetZombie = null
    // moveDirection은 유지 (수동 컨트롤과 병행 가능)
    
    setAutoCombat(g.autoCombat)
  }, [])
  
  const handleMove = useCallback((direction) => {
    gameRef.current.moveDirection = direction
  }, [])
  
  const handleControllerEnd = useCallback(() => {
    setControllerPosition(null)
    gameRef.current.moveDirection = null
  }, [])
  
  // 화면 탭/클릭으로 컨트롤러 생성 (자동 전투 모드와 병행 가능)
  const handleScreenTap = useCallback((e) => {
    if (!gameStarted || gameOver) return
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // HUD 영역이나 다른 UI 요소와 겹치지 않는지 확인
    const hudTop = 20
    const hudHeight = 120 // 무기 슬롯 포함
    
    if (clientY > hudTop + hudHeight) {
      setControllerPosition({ x: clientX, y: clientY })
    }
  }, [gameStarted, gameOver])
  
  // 무기 아이템 드롭
  const dropWeaponItem = useCallback((g, x, z) => {
    const weaponTypes = ['fire', 'ice', 'lightning']
    const randomType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)]
    
    g.weaponItems.push({
      x, z, type: randomType,
      life: 600 // 10초 (60fps 기준)
    })
  }, [])
  
  // 무기 획득
  const collectWeapon = useCallback((weaponType) => {
    const g = gameRef.current
    const existingWeapon = g.weapons.find(w => w.type === weaponType)
    
    if (existingWeapon) {
      existingWeapon.level++
    } else {
      g.weapons.push({ type: weaponType, level: 1, cooldown: 0 })
    }
    
    // 최대 3개 무기까지
    if (g.weapons.length > 3) {
      g.weapons.shift()
    }
    
    triggerUpdate()
  }, [triggerUpdate])
  
  useEffect(() => {
    let animationId
    
    const gameLoop = (timestamp) => {
      const g = gameRef.current
      
      if (!g.gameStarted || g.gameOver) {
        animationId = requestAnimationFrame(gameLoop)
        return
      }
      
      // 웨이브 딜레이
      if (g.waveDelay > 0) {
        g.waveDelay--
        setWaveDelay(g.waveDelay)
        animationId = requestAnimationFrame(gameLoop)
        return
      }
      
      // 좀비 스폰
      g.spawnTimer++
      const spawnRate = Math.max(60, 120 - g.wave * 15)
      if (g.spawnTimer >= spawnRate && g.zombies.length < g.zombiesPerWave + g.wave * 2) {
        spawnZombie(g)
        g.spawnTimer = 0
      }
      
      // 무기 아이템 드롭 (랜덤하게)
      g.weaponDropTimer++
      if (g.weaponDropTimer >= 600 && Math.random() < 0.3) { // 10초마다 30% 확률
        const angle = Math.random() * Math.PI * 2
        const distance = 8 + Math.random() * 5
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        dropWeaponItem(g, x, z)
        g.weaponDropTimer = 0
      }
      
      // 무기 아이템 업데이트 및 플레이어와의 충돌 체크
      g.weaponItems = g.weaponItems.filter(item => {
        item.life--
        if (item.life <= 0) return false
        
        const dx = item.x - g.player.x
        const dz = item.z - g.player.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        
        if (dist < 2) {
          collectWeapon(item.type)
          return false
        }
        
        return true
      })
      
      // 수동 이동 (컨트롤러 사용) - 우선순위 높음
      if (g.moveDirection) {
        g.player.x += g.moveDirection.x * g.player.speed
        g.player.z += g.moveDirection.z * g.player.speed
        
        // 경계 제한
        const maxDist = 15
        const dist = Math.sqrt(g.player.x ** 2 + g.player.z ** 2)
        if (dist > maxDist) {
          g.player.x = (g.player.x / dist) * maxDist
          g.player.z = (g.player.z / dist) * maxDist
        }
      }
      // 자동 전투 모드: 수동 컨트롤이 없을 때만 자동 이동
      else if (g.autoCombat && g.zombies.length > 0) {
        // 타겟 좀비가 없거나 죽었으면 새로운 타겟 찾기
        if (!g.targetZombie || !g.zombies.includes(g.targetZombie)) {
          let nearest = null
          let nearestDist = Infinity
          
          g.zombies.forEach(z => {
            const dx = z.x - g.player.x
            const dz = z.z - g.player.z
            const d = Math.sqrt(dx * dx + dz * dz)
            if (d < nearestDist) {
              nearest = z
              nearestDist = d
            }
          })
          
          g.targetZombie = nearest
        }
        
        // 타겟 좀비로 이동
        if (g.targetZombie) {
          const dx = g.targetZombie.x - g.player.x
          const dz = g.targetZombie.z - g.player.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          
          // 공격 범위 밖이면 이동
          if (dist > g.player.attackRange * 0.8) {
            g.player.x += (dx / dist) * g.player.speed
            g.player.z += (dz / dist) * g.player.speed
          }
          
          // 경계 제한
          const maxDist = 15
          const playerDist = Math.sqrt(g.player.x ** 2 + g.player.z ** 2)
          if (playerDist > maxDist) {
            g.player.x = (g.player.x / playerDist) * maxDist
            g.player.z = (g.player.z / playerDist) * maxDist
          }
        }
      }
      
      // 자동 공격 (보유한 모든 무기로, 각 무기별 독립 쿨다운)
      g.weapons.forEach(weapon => {
        weapon.cooldown = Math.max(0, weapon.cooldown - 1)
        const weaponData = WEAPON_TYPES[weapon.type]
        const baseCooldown = weaponData.cooldown / weapon.level
        
        if (weapon.cooldown === 0 && g.zombies.length > 0) {
          let nearest = null
          let nearestDist = Infinity
          
          g.zombies.forEach(z => {
            const dx = z.x - g.player.x
            const dz = z.z - g.player.z
            const d = Math.sqrt(dx * dx + dz * dz)
            if (d < nearestDist && d < g.player.attackRange) {
              nearest = z
              nearestDist = d
            }
          })
          
          if (nearest) {
            const dx = nearest.x - g.player.x
            const dz = nearest.z - g.player.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            g.bullets.push({
              x: g.player.x,
              z: g.player.z,
              vx: (dx / dist) * 0.3,
              vz: (dz / dist) * 0.3,
              damage: weaponData.damage * weapon.level,
              weaponType: weapon.type,
              size: 0.2 + (weapon.level - 1) * 0.1
            })
            weapon.cooldown = Math.max(12, baseCooldown)
          }
        }
      })
      
      // 총알 업데이트
      g.bullets = g.bullets.filter(b => {
        b.x += b.vx
        b.z += b.vz
        
        if (Math.abs(b.x) > 20 || Math.abs(b.z) > 20) return false
        
        for (let i = g.zombies.length - 1; i >= 0; i--) {
          const z = g.zombies[i]
          const dx = b.x - z.x
          const dz = b.z - z.z
          const d = Math.sqrt(dx * dx + dz * dz)
          
          if (d < 1.5) {
            z.hp -= b.damage || 1
            if (z.hp <= 0) {
              // 파티클 생성
              for (let p = 0; p < 5; p++) {
                g.particles.push({
                  x: z.x,
                  z: z.z,
                  vx: (Math.random() - 0.5) * 0.2,
                  vz: (Math.random() - 0.5) * 0.2,
                  life: 30,
                  maxLife: 30
                })
              }
              g.zombies.splice(i, 1)
              g.score += 10 * g.wave
              g.zombiesKilled++
              setScore(g.score)
              
              // 웨이브 클리어 체크
              if (g.zombiesKilled >= g.zombiesPerWave + (g.wave - 1) * 2) {
                g.wave++
                g.zombiesKilled = 0
                g.waveDelay = 90
                setWaveDelay(90)
                if (g.wave > 5) {
                  g.gameOver = true
                  g.score += 500
                  setScore(g.score)
                  setGameOver(true)
                } else {
                  setWave(g.wave)
                }
              }
            }
            return false
          }
        }
        return true
      })
      
      // 좀비 업데이트
      g.zombies.forEach(z => {
        const dx = g.bonfire.x - z.x
        const dz = g.bonfire.z - z.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        z.x += (dx / dist) * z.speed
        z.z += (dz / dist) * z.speed
        
        // 모닥불 공격
        if (dist < 2) {
          g.bonfire.hp -= 0.02
          setBonfireHp(Math.ceil(g.bonfire.hp))
          if (g.bonfire.hp <= 0) {
            g.gameOver = true
            setGameOver(true)
          }
        }
      })
      
      // 파티클 업데이트
      g.particles = g.particles.filter(p => {
        p.x += p.vx
        p.z += p.vz
        p.life--
        return p.life > 0
      })
      
      // 3D 렌더링 업데이트 트리거 (60fps로 제한)
      if (Math.floor(timestamp / 16) % 2 === 0) {
        triggerUpdate()
      }
      
      animationId = requestAnimationFrame(gameLoop)
    }
    
    animationId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animationId)
  }, [spawnZombie, triggerUpdate, dropWeaponItem, collectWeapon])
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#111827' }}>
      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10,
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          display: 'flex',
          gap: '32px',
          color: 'white',
          fontSize: '18px',
          alignItems: 'center'
        }}>
          <span>점수: <strong style={{ color: '#facc15' }}>{score}</strong></span>
          <span>웨이브: <strong style={{ color: '#60a5fa' }}>{wave}</strong>/5</span>
          <span>모닥불: <strong style={{ color: bonfireHp > 3 ? '#4ade80' : '#ef4444' }}>
            {'❤️'.repeat(Math.max(0, bonfireHp))}
          </strong></span>
          
          {/* 자동 전투 모드 버튼 */}
          {gameStarted && !gameOver && (
            <button
              onClick={toggleAutoCombat}
              style={{
                padding: '8px 16px',
                background: autoCombat ? '#22c55e' : 'rgba(0, 0, 0, 0.6)',
                border: `2px solid ${autoCombat ? '#22c55e' : '#6b7280'}`,
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>{autoCombat ? '⚔️' : '🤖'}</span>
              <span>{autoCombat ? '자동 전투 ON' : '자동 전투 OFF'}</span>
            </button>
          )}
        </div>
        
        {/* 무기 슬롯 */}
        {gameStarted && !gameOver && gameRef.current.weapons.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <span style={{ color: '#9ca3af', fontSize: '14px', marginRight: '8px' }}>무기:</span>
            {gameRef.current.weapons.map((weapon, idx) => {
              const weaponData = WEAPON_TYPES[weapon.type]
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: `2px solid ${weaponData.color}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <span style={{ color: weaponData.color, fontWeight: 'bold' }}>
                    {weaponData.name}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    Lv.{weapon.level}
                  </span>
                  <span style={{ color: '#facc15', fontSize: '12px' }}>
                    ⚔️ {weaponData.damage * weapon.level}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 3D 게임 화면 */}
      <div 
        style={{ width: '100%', height: '100%' }}
        onClick={handleScreenTap}
        onTouchStart={handleScreenTap}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 20, 20]} fov={60} />
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
            target={[0, 0, 0]}
          />
          <GameWorld gameRef={gameRef} forceUpdate={triggerUpdate} />
        </Canvas>
      </div>
      
      {/* 시작 화면 */}
      {!gameStarted && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}>
          <h1 style={{ color: '#f97316', fontSize: '32px', marginBottom: '16px', fontWeight: 'bold' }}>
            🔥 모닥불 디펜스 3D
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '8px' }}>화면을 탭하여 이동 컨트롤러 생성</p>
          <p style={{ color: '#9ca3af', marginBottom: '8px' }}>자동으로 가까운 좀비 공격</p>
          <p style={{ color: '#9ca3af', marginBottom: '8px' }}>무기 아이템을 획득하여 공격력 강화!</p>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>상단 자동 전투 모드로 자동 사냥 가능</p>
          <button
            onClick={startGame}
            style={{
              padding: '16px 32px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            게임 시작
          </button>
        </div>
      )}
      
      {/* 게임 오버 화면 */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}>
          <h2 style={{ color: 'white', fontSize: '28px', marginBottom: '8px', fontWeight: 'bold' }}>
            {wave > 5 ? '🎉 승리!' : '💀 게임 오버'}
          </h2>
          <p style={{ color: '#facc15', fontSize: '24px', marginBottom: '24px' }}>
            최종 점수: {score}
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '16px 32px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            다시 하기
          </button>
        </div>
      )}
      
      {/* 이동 컨트롤러 (동적 생성) - 자동 전투 모드와 병행 가능 */}
      {controllerPosition && (
        <MovementController 
          position={controllerPosition}
          onMove={handleMove}
          onEnd={handleControllerEnd}
          disabled={!gameStarted || gameOver}
        />
      )}
      
      {/* 게임 정보 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        color: '#6b7280',
        fontSize: '14px',
        textAlign: 'right',
        zIndex: 10
      }}>
        <p>🔵 플레이어 | 🟢 좀비 | 🟠 모닥불</p>
        <p>모닥불을 5웨이브 동안 지켜라!</p>
      </div>
    </div>
  )
}

