// هذا كود تشخيصي بسيط لاختبار ما إذا كانت الأزرار تعمل

console.log("ملف script.js تم تحميله بنجاح!");

document.addEventListener('DOMContentLoaded', () => {

    console.log("تم تحميل محتوى الصفحة بالكامل!");

    // البحث عن زر "إضافة فرد للعائلة"
    const addBtn = document.getElementById('add-member-btn');

    if (addBtn) {
        console.log("تم العثور على زر الإضافة بنجاح!");
        
        // إضافة حدث النقر
        addBtn.addEventListener('click', () => {
            alert("لقد عمل الزر بنجاح! المشكلة ليست في ربط الأزرار.");
        });

    } else {
        console.error("خطأ: لم يتم العثور على زر 'add-member-btn'. تحقق من ملف index.html.");
    }
});
