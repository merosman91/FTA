// اختبار تشخيصي بسيط للغاية: هل تعمل الأزرار؟

document.addEventListener('DOMContentLoaded', () => {

    console.log("تم تحميل الصفحة. بدء اختبار الأزرار...");

    // البحث عن الزر الرئيسي
    const addBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');

    // إنشاء عنصر لعرض الرسائل على الصفحة
    const statusDiv = document.createElement('div');
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '10px';
    statusDiv.style.left = '10px';
    statusDiv.style.padding = '10px';
    statusDiv.style.backgroundColor = '#f39c12';
    statusDiv.style.color = 'white';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '10000';
    document.body.appendChild(statusDiv);


    if (addBtn) {
        statusDiv.textContent = "نجح: تم العثور على زر الإضافة. جرب النقر عليه.";
        addBtn.addEventListener('click', () => {
            alert("نجاح! زر الإضافة يعمل. المشكلة كانت في الكود المعقد.");
        });
    } else {
        statusDiv.textContent = "فشل: لم يتم العثور على زر الإضافة. المشكلة في ملف HTML أو في ربط الملفات.";
        statusDiv.style.backgroundColor = '#e74c3c';
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            alert("نجاح! زر المشاركة يعمل أيضًا.");
        });
    } else {
        if(addBtn) { // لا نغير الرسالة إذا فشل أول زر بالفعل
            statusDiv.textContent = "فشل: لم يتم العثور على زر المشاركة أيضًا.";
            statusDiv.style.backgroundColor = '#e74c3c';
        }
    }
});
