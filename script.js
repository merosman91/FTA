// الخطوة 2: بناء الوظائف الأساسية خطوة بخطوة

console.log("ملف script.js تم تحميله بنجاح!");

document.addEventListener('DOMContentLoaded', () => {

    console.log("تم تحميل محتوى الصفحة بالكامل!");

    // --- عناصر DOM ---
    const addBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const closeBtns = document.querySelectorAll('.close-btn');

    // --- اختبار الأزرار ---
    if (addBtn) {
        console.log("تم العثور على زر الإضافة!");
        addBtn.addEventListener('click', () => {
            console.log("تم النقر على زر الإضافة!");
            // بدلاً من alert، سنفتح النافذة المنبثقة
            memberModal.style.display = 'block';
        });
    } else {
        console.error("لم يتم العثور على زر الإضافة.");
    }

    if (shareBtn) {
        console.log("تم العثور على زر المشاركة!");
        shareBtn.addEventListener('click', () => {
            alert("زر المشاركة يعمل!");
        });
    } else {
        console.error("لم يتم العثور على زر المشاركة.");
    }

    // --- وظيفة إغلاق النوافذ ---
    if (closeBtns.length > 0) {
        console.log(`تم العثور على ${closeBtns.length} أزرار إغلاق.`);
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log("تم النقر على زر الإغلاق!");
                memberModal.style.display = 'none';
            });
        });
    } else {
        console.error("لم يتم العثور على أزرار الإغلاق.");
    }

    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', (event) => {
        if (event.target === memberModal) {
            memberModal.style.display = 'none';
        }
    });

});
