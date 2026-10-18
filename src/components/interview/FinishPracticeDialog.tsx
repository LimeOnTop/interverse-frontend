import { useModalDialog } from '../../hooks/useModalDialog'
export default function FinishPracticeDialog({ skipped, onCancel, onConfirm }: { skipped: number; onCancel: () => void; onConfirm: () => void }) {
    const dialog = useModalDialog()
    return <dialog ref={dialog} className="pr-dialog" aria-labelledby="finish-practice-title" onCancel={onCancel}><div className="pr-dialog-body"><h2 id="finish-practice-title">Завершить с пропусками?</h2><p className="pr-note">Без ответа осталось: {skipped}. Эти вопросы и задачи получат 0 баллов и будут отмечены в отчёте как пропущенные. Можно вернуться и ответить на них.</p><div className="pr-actions"><button className="pr-btn" autoFocus onClick={onCancel}>Вернуться к вопросам</button><button className="pr-btn primary" onClick={onConfirm}>Завершить с пропусками</button></div></div></dialog>
}
