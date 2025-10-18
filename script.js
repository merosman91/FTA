// البناء خطوة بخطوة: الخطوة 1 - فتح وإغلاق النافذة

document.addEventListener('DOMContentLoaded', () => {

    console.log("تم تحميل الصفحة. بدء بناء التطبيق خطوة بخطوة...");

    // --- عناصر DOM ---
    const addBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const closeBtns = document.querySelectorAll('.close-btn');

    // --- معالجات الأحداث ---
    if (addBtn) {
        console.log("ربط حدث النقر بزر الإضافة...");
        addBtn.addEventListener('click', () => {
            console.log("تم النقر على زر الإضافة! جاري فتح النافذة.");
            memberModal.style.display = 'block';
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            alert("زر المشاركة يعمل!");
        });
    }

    if (closeBtns.length > 0) {
        console.log(`ربط أحداث الإغلاق لـ ${closeBtns.length} زر...`);
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log("تم النقر على زر الإغلاق! جاري إغلاق النافذة.");
                memberModal.style.display = 'none';
            });
        });
    }

    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', (event) => {
        if (event.target === memberModal) {
            memberModal.style.display = 'none';
        }
    });

    console.log("اكتمل الإعداد الأساسي للواجهة.");
});
