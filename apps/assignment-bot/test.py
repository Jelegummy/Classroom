import asyncio
from prisma import Prisma


async def main():
    db = Prisma()
    await db.connect()

    # ลองดึงข้อมูล User คนแรกออกมาดู
    user = await db.user.find_first()

    if user:
        print(f"เชื่อมต่อสำเร็จ! พบ User: {user.email}")
    else:
        print("เชื่อมต่อสำเร็จ! แต่ยังไม่มีข้อมูลในตาราง User")

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
