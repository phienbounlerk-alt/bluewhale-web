export default function DataDeletionPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-black text-[#1247D8]">ການລົບຂໍ້ມູນ</h1>

      <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
        <p>ທ່ານສາມາດຂໍລົບຂໍ້ມູນສ່ວນຕົວທັງໝົດຂອງທ່ານຈາກ BlueWhale ໄດ້ທຸກເວລາ.</p>

        <section className="bg-blue-50 rounded-xl p-4 space-y-2">
          <h2 className="font-bold text-base text-[#1247D8]">ວິທີຂໍລົບຂໍ້ມູນ</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>ສົ່ງອີເມວໄປທີ່ <strong>support@bluewhalelao.com</strong></li>
            <li>ໃສ່ຫົວຂໍ້: "ຂໍລົບຂໍ້ມູນ"</li>
            <li>ລະບຸ: ຊື່ ແລະ ອີເມວທີ່ໃຊ້ລົງທະບຽນ</li>
          </ol>
        </section>

        <p>ພວກເຮົາຈະດໍາເນີນການລົບຂໍ້ມູນພາຍໃນ 30 ວັນ ຫຼັງຈາກໄດ້ຮັບຄໍາຂໍ.</p>

        <p className="text-gray-500">ຕິດຕໍ່: support@bluewhalelao.com</p>
      </div>
    </div>
  )
}
