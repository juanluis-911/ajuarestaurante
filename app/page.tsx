'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const RED = '#CC1F2D'
const GREEN = '#2D6B2D'
const BG = '#080606'

function useTypewriter(text: string, speed = 45) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    setDisplay('')
    let i = 0
    const id = setInterval(() => {
      setDisplay(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return display
}

function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: -20,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${RED}bb, transparent)`,
      }}
      animate={{ y: -900, opacity: [0, 0.9, 0] }}
      transition={{ duration: 7 + Math.random() * 4, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

function Reveal({ children, className = '', delay = 0, style }: { children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 56 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function LocationCard({ city, state, address, hours, delay }: {
  city: string; state: string; address: string; hours: string; delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 28,
        backdropFilter: 'blur(20px)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* red glow on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${RED}33 0%, transparent 70%)`,
          borderRadius: 28,
        }}
      />
      {/* top border accent */}
      <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: `linear-gradient(90deg, transparent, ${RED}, transparent)` }} />

      {/* floating pin */}
      <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 36 }}
        >
          📍
        </motion.div>
      </div>

      <div style={{ paddingTop: 52, paddingBottom: 36, paddingLeft: 32, paddingRight: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase' }}>{state}</p>
        <h3 style={{ fontFamily: 'var(--font-oswald)', color: '#fff', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          {city}
        </h3>
        <div style={{ width: 48, height: 3, borderRadius: 99, background: RED }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>{address}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 18px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          <span>🕐</span><span>{hours}</span>
        </div>
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          style={{ marginTop: 12, padding: '10px 28px', borderRadius: 99, background: RED, color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `0 0 24px ${RED}55` }}
        >
          Ver Menú
        </motion.div>
      </div>
    </motion.div>
  )
}

function MenuCard({ emoji, name, desc, price, delay }: { emoji: string; name: string; desc: string; price: string; delay: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'default',
      }}
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, -3, 0] }}
        transition={{ duration: 0.5, delay: delay + 0.9 }}
        style={{ fontSize: 42 }}
      >{emoji}</motion.div>
      <h4 style={{ fontFamily: 'var(--font-oswald)', color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{name}</h4>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, flex: 1 }}>{desc}</p>
      <p style={{ fontFamily: 'var(--font-oswald)', color: RED, fontSize: 22, fontWeight: 900 }}>{price}</p>
      {/* bottom line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${RED}, ${GREEN})`, transformOrigin: 'left', borderRadius: 99 }}
      />
    </motion.div>
  )
}

const STRIP = ['🍔 AJÚA!', '🔥 HUATABAMPO', '🌶️ NAVOJOA', '🍟 CRAFT BURGERS', '🥤 SUR DE SONORA']

function Marquee() {
  const items = [...STRIP, ...STRIP, ...STRIP, ...STRIP]
  return (
    <div style={{ background: RED, overflow: 'hidden', padding: '14px 0' }}>
      <motion.div
        style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap' }}
        animate={{ x: ['0%', '-25%'] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-oswald)', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
  const tagline = useTypewriter('LAS MEJORES HAMBURGUESAS DEL SUR DE SONORA', 42)
  const [mobileOpen, setMobileOpen] = useState(false)

  const particles = Array.from({ length: 20 }, (_, i) => ({
    delay: i * 0.32,
    x: (i / 20) * 100,
    size: 4 + (i % 4) * 2,
  }))

  return (
    <div style={{ backgroundColor: BG, color: '#fff', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'var(--font-nunito)' }}>

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 40px',
          backdropFilter: 'blur(20px)',
          background: 'rgba(8,6,6,0.75)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🍔</span>
          <span style={{ fontFamily: 'var(--font-oswald)', color: RED, fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>AJÚA!</span>
        </div>
        <div className="hidden md:flex" style={{ gap: 32, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
          {['#menu', '#sucursales', '#nosotros'].map(h => (
            <a key={h} href={h} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              {h.replace('#', '').toUpperCase()}
            </a>
          ))}
        </div>
        <Link href="/login" className="hidden md:flex" style={{ padding: '8px 20px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.65)' }}
        >
          Admin
        </Link>
        <button className="md:hidden" onClick={() => setMobileOpen(v => !v)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 40, background: 'rgba(8,6,6,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 0', fontSize: 18, fontWeight: 700 }}
          >
            {['#menu', '#sucursales', '#nosotros'].map(h => (
              <a key={h} href={h} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                {h.replace('#', '').toUpperCase()}
              </a>
            ))}
            <Link href="/login" style={{ padding: '10px 28px', borderRadius: 99, background: RED, color: '#fff', textDecoration: 'none', fontWeight: 800 }} onClick={() => setMobileOpen(false)}>
              Admin
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* BG glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80vw', height: '80vw', borderRadius: '50%', background: `${RED}18`, filter: 'blur(120px)' }} />
          <div style={{ position: 'absolute', top: '30%', right: '20%', width: '40vw', height: '40vw', borderRadius: '50%', background: `${GREEN}10`, filter: 'blur(100px)' }} />
        </div>
        {/* grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `linear-gradient(${RED} 1px, transparent 1px), linear-gradient(90deg, ${RED} 1px, transparent 1px)`, backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        {/* particles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {particles.map((p, i) => <Particle key={i} {...p} />)}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, padding: '0 16px' }}>
          {/* badge */}
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 220 }}
            style={{ padding: '6px 18px', borderRadius: 99, border: `1px solid ${RED}66`, background: `${RED}18`, color: RED, fontSize: 11, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' }}
          >
            🔥 Craft Burger Experience
          </motion.div>

          {/* title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.55, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: 'clamp(6rem, 24vw, 20rem)',
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              background: `linear-gradient(140deg, #fff 0%, ${RED} 45%, #fff 100%)`,
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradShift 5s ease infinite',
              textShadow: 'none',
            }}
          >
            AJÚA!
          </motion.h1>

          {/* floating emojis */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
            style={{ display: 'flex', gap: 16, fontSize: 36 }}
          >
            {['🍔', '🌶️', '🍟', '🥤', '🔥'].map((e, i) => (
              <motion.span key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 1.8, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}>
                {e}
              </motion.span>
            ))}
          </motion.div>

          {/* typewriter */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600, minHeight: '1.5em' }}
          >
            {tagline}
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
              style={{ display: 'inline-block', width: 2, height: 14, background: RED, marginLeft: 4, verticalAlign: 'middle', borderRadius: 1 }}
            />
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}
          >
            <motion.a href="#sucursales" whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px 36px', borderRadius: 99, background: RED, color: '#fff',
                fontFamily: 'var(--font-oswald)', fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase',
                boxShadow: `0 0 40px ${RED}55`, textDecoration: 'none', display: 'block',
              }}
            >
              Ver Sucursales
            </motion.a>
            <motion.a href="#menu" whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px 36px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.22)', color: '#fff',
                fontFamily: 'var(--font-oswald)', fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase',
                textDecoration: 'none', display: 'block',
              }}
            >
              Nuestro Menú
            </motion.a>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.25)' }}
        >
          <span style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase' }}>scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── SUCURSALES ── */}
      <section id="sucursales" style={{ padding: '112px 16px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${RED}0a 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal className="text-center" style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: RED, fontSize: 11, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 12 }}>Encuéntranos</p>
            <h2 style={{ fontFamily: 'var(--font-oswald)', fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
              NUESTRAS<br /><span style={{ color: RED }}>SUCURSALES</span>
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
            <LocationCard city="Huatabampo" state="Sonora, México" address="Calle Principal #123, Col. Centro" hours="Lun–Dom · 12:00 – 22:00" delay={0.1} />
            <LocationCard city="Navojoa" state="Sonora, México" address="Blvd. Morelos #456, Col. Moderna" hours="Lun–Dom · 12:00 – 22:00" delay={0.25} />
          </div>

          <Reveal delay={0.4} style={{ textAlign: 'center', marginTop: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 99, border: '1px dashed rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>●</motion.span>
              Más sucursales próximamente en el sur de Sonora
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MENU ── */}
      <section id="menu" style={{ padding: '112px 16px', position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '40vw', height: '40vw', borderRadius: '50%', background: `${GREEN}0e`, filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: GREEN, fontSize: 11, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 12 }}>Lo que ofrecemos</p>
            <h2 style={{ fontFamily: 'var(--font-oswald)', fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, color: '#fff' }}>
              NUESTRO<br /><span style={{ color: GREEN }}>MENÚ</span>
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
            <MenuCard emoji="🍔" name="Ajúa Classic" desc="200g de carne angus, cheddar artesanal, lechuga, tomate y nuestra salsa secreta" price="$145" delay={0} />
            <MenuCard emoji="🌶️" name="Sonora Fuego" desc="Jalapeños tatemados, queso fundido, tocino crujiente y chipotle casero" price="$165" delay={0.07} />
            <MenuCard emoji="🥓" name="Doble Tocino" desc="Doble carne, triple tocino, queso americano derretido y salsa BBQ ahumada" price="$185" delay={0.14} />
            <MenuCard emoji="🍟" name="Papas Ajúa" desc="Crujientes, con cáscara, aderezadas con chile piquín y limón sonorense" price="$55" delay={0.21} />
            <MenuCard emoji="🥤" name="Malteadas" desc="Vainilla, chocolate o fresa. Cremosas y espesas como deben ser" price="$75" delay={0.28} />
            <MenuCard emoji="🌮" name="Combo Norteño" desc="Hamburguesa + papas + refresco. El combo que arrasa en Sonora" price="$210" delay={0.35} />
          </div>
          <Reveal delay={0.45} style={{ textAlign: 'center', marginTop: 48 }}>
            <motion.a href="#sucursales" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ display: 'inline-block', padding: '14px 40px', borderRadius: 99, border: `2px solid ${GREEN}`, color: GREEN, fontFamily: 'var(--font-oswald)', fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              Ver Menú Completo
            </motion.a>
          </Reveal>
        </div>
      </section>

      {/* ── NOSOTROS ── */}
      <section id="nosotros" style={{ padding: '112px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <Reveal>
            <p style={{ color: RED, fontSize: 11, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>Nuestra Historia</p>
            <h2 style={{ fontFamily: 'var(--font-oswald)', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, color: '#fff', marginBottom: 24 }}>
              PASIÓN POR LA<br /><span style={{ color: RED }}>HAMBURGUESA</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 16 }}>
              Nacimos en el corazón del sur de Sonora con una misión simple: hacer las mejores hamburguesas de la región. Carne fresca, pan de brioche artesanal y sabores que te gritan <strong style={{ color: '#fff' }}>¡Ajúa!</strong> desde el primer mordisco.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>
              Hoy contamos con dos sucursales en <strong style={{ color: '#fff' }}>Huatabampo</strong> y <strong style={{ color: '#fff' }}>Navojoa</strong>, y seguimos creciendo para llevar nuestra experiencia a más rincones del estado.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { num: '2', label: 'Sucursales' },
                { num: '50+', label: 'Opciones en menú' },
                { num: '5★', label: 'Calificación' },
                { num: '100%', label: 'Carne fresca' },
              ].map(({ num, label }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{ borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '28px 16px', textAlign: 'center' }}
                >
                  <p style={{ fontFamily: 'var(--font-oswald)', color: RED, fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{num}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6 }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '112px 16px', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '70vw', height: '70vw', borderRadius: '50%', background: RED, filter: 'blur(140px)', pointerEvents: 'none' }}
        />
        <Reveal style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
          <motion.div animate={{ rotate: [0, 10, -10, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 72, display: 'inline-block', marginBottom: 24 }}
          >
            🍔
          </motion.div>
          <h2 style={{ fontFamily: 'var(--font-oswald)', fontSize: 'clamp(3.5rem, 12vw, 8rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, color: '#fff', marginBottom: 24 }}>
            ¿TIENES<br /><span style={{ color: RED }}>HAMBRE?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 36, fontSize: 16 }}>
            Visítanos en Huatabampo o Navojoa — tus hamburguesas favoritas te esperan.
          </p>
          <motion.a href="#sucursales" whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-block', padding: '18px 48px', borderRadius: 99, background: RED, color: '#fff',
              fontFamily: 'var(--font-oswald)', fontWeight: 700, fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase',
              boxShadow: `0 0 60px ${RED}55`, textDecoration: 'none',
            }}
          >
            🔥 Encuéntranos Ahora
          </motion.a>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🍔</span>
            <span style={{ fontFamily: 'var(--font-oswald)', color: 'rgba(255,255,255,0.65)', fontSize: 18, fontWeight: 900 }}>AJÚA!</span>
            <span>Las mejores hamburguesas del sur de Sonora</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#menu" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Menú</a>
            <a href="#sucursales" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Sucursales</a>
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Admin</Link>
          </div>
          <p>© {new Date().getFullYear()} Ajúa Restaurantes</p>
        </div>
      </footer>

      <style>{`
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        * { box-sizing: border-box; }
        a { cursor: pointer; }
      `}</style>
    </div>
  )
}
