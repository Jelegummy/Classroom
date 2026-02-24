import { toast } from 'sonner'
import { Props } from '../types'

export default function StateLink({ onClose }: Props) {
  const generatedLink =
    'https://discord.com/oauth2/authorize?client_id=1444353472362451047&permissions=8&integration_type=0&scope=bot'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      toast.success('คัดลอกลิ้งก์สำเร็จ!')
    } catch (err) {
      toast.error('ไม่สามารถคัดลอกลิ้งก์ได้')
    }
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-bold text-success">
          ข้อมูลลิ้งก์การเชิญ Bot
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          กรุณาคัดลอกลิ้งก์ด้านล่างเพื่อนำไปเชิญ Bot เข้าสู่ Discord Channel
          ของคุณ
        </p>

        <div className="mb-2 flex gap-2">
          <input
            type="text"
            className="input input-bordered w-full bg-base-200"
            value={generatedLink}
            readOnly
          />
          <button className="btn btn-primary" onClick={copyToClipboard}>
            Copy
          </button>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost hover:bg-error" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </dialog>
  )
}
