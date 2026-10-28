import { useDialogMotion } from '../hooks/useDialogMotion'
import { useEffect, useRef, useState } from 'react'
import { Play, Pause, X, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'

const VIDEO = '/media/interverse-overview.mp4'
export const VIDEO_CHAPTERS = [{ time: 0, name: 'Знакомство' }, { time: 6, name: 'Тренировки' }, { time: 12, name: 'Отчёты' }, { time: 19, name: 'Вакансии' }, { time: 25, name: 'Твой ритм' }]
const clock = (value: number) => `0:${Math.floor(value).toString().padStart(2, '0')}`

export default function LandingVideo({ startAt, onClose: finishClose }: { startAt: number; onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null)
    const video = useRef<HTMLVideoElement>(null)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [time, setTime] = useState(startAt)
    const [duration, setDuration] = useState(36)
    const [error, setError] = useState(false)
    const [ready, setReady] = useState(false)
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null
        dialog.current?.showModal()
        // Attach the source only after the modal has opened.
        const frame = requestAnimationFrame(() => {
            if (!dialog.current?.open || !video.current) return
            video.current.src = VIDEO
            void video.current.play().catch(() => setPlaying(false))
        })
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { cancelAnimationFrame(frame); video.current?.pause(); video.current?.removeAttribute('src'); video.current?.load(); dialog.current?.close(); document.body.style.overflow = previousOverflow; previous?.focus() }
    }, [])
    const toggle = () => {
        const el = video.current
        if (!el) return
        if (el.paused) void el.play().catch(() => setPlaying(false))
        else el.pause()
    }
    const seek = (value: number) => { if (video.current && ready) video.current.currentTime = value; setTime(value) }
    const onClose = useDialogMotion(dialog, finishClose)
    return <dialog ref={dialog} className="iv-film-dialog" aria-labelledby="film-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="iv-film-shell">
            <div className="iv-film-heading"><div><span className="iv-eyebrow">INTERVERSE / В ДЕЙСТВИИ</span><h2 id="film-title">Твой следующий шаг</h2></div><button data-iv-close autoFocus className="iv-film-icon" onClick={onClose} aria-label="Закрыть видео"><X /></button></div>
            <div className="iv-film-screen">
                <video ref={video} playsInline preload="none" onLoadedMetadata={() => { if (video.current) { setDuration(video.current.duration); video.current.currentTime = startAt; setReady(true); void video.current.play().catch(() => setPlaying(false)) } }} onTimeUpdate={() => setTime(video.current?.currentTime || 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(true)} onClick={toggle} aria-label="Видео о возможностях InterVerse" />
                {!playing && !error && <button className="iv-film-play" onClick={toggle} aria-label={time >= duration ? 'Посмотреть ещё раз' : 'Воспроизвести видео'}>{time >= duration ? <RotateCcw /> : <Play fill="currentColor" />}</button>}
                {error && <div className="iv-film-error"><p>Не удалось загрузить видео. Проверь подключение и попробуй ещё раз.</p><button className="iv-landing-button" onClick={() => { setError(false); video.current?.load() }}>Повторить</button></div>}
            </div>
            <div className="iv-film-controls"><button className="iv-film-icon" onClick={toggle} aria-label={playing ? 'Пауза' : 'Воспроизвести'}>{playing ? <Pause /> : <Play />}</button><span className="iv-film-time">{clock(time)}</span><input aria-label="Позиция видео" type="range" min="0" max={duration} step="0.1" value={time} disabled={!ready} onChange={e => seek(Number(e.target.value))} /><span className="iv-film-time">{clock(duration)}</span><button className="iv-film-icon" onClick={() => { if (video.current) video.current.muted = !muted; setMuted(!muted) }} aria-label={muted ? 'Включить звук' : 'Выключить звук'}>{muted ? <VolumeX /> : <Volume2 />}</button><button className="iv-film-icon" onClick={() => { const el = video.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void }; if (document.fullscreenEnabled) void dialog.current?.requestFullscreen().catch(() => undefined); else el?.webkitEnterFullscreen?.() }} aria-label="На весь экран"><Maximize /></button></div>
            <div className="iv-film-chapters" aria-label="Главы видео">{VIDEO_CHAPTERS.map((chapter, i) => <button key={chapter.time} className={time >= chapter.time && time < (VIDEO_CHAPTERS[i + 1]?.time || duration + 1) ? 'active' : ''} onClick={() => seek(chapter.time)} disabled={!ready}><span>{clock(chapter.time)}</span>{chapter.name}</button>)}</div>
        </div>
    </dialog>
}
