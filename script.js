// تشخيص للنسخة الجديدة: هل تتطابق الملفات؟

document.addEventListener('DOMContentLoaded', () => {

    console.log("بدء فحص التشخيص للنسخة الجديدة...");

    const elementIds = [
        'add-member-btn', 'share-btn', 'member-modal', 'member-form', 'modal-title',
        'close-btns', 'empty-state', 'tree-svg', 'context-menu', 'details-modal',
        'details-name', 'details-photo', 'details-info', 'details-story',
        'edit-member-btn', 'delete-member-btn', 'photo'
    ];

    let allFound = true;
    const missingElements = [];

    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            allFound = false;
            missingElements.push(id);
        }
    });

    // التحقق من وجود عناصر متعددة (مثل closeBtns)
    const closeBtns = document.querySelectorAll('.close-btn');
    if (closeBtns.length === 0) {
        allFound = false;
        missingElements.push('.close-btn');
    }


    const statusDiv = document.createElement('div');
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '10px';
    statusDiv.style.left = '10px';
    statusDiv.style.padding = '15px';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '10000';
    statusDiv.style.fontFamily = 'Tajawal, sans-serif';
    statusDiv.style.fontSize = '1rem';
    document.body.appendChild(statusDiv);

    if (allFound) {
        statusDiv.textContent = "نجح: جميع عناصر HTML موجودة. المشكلة هي على الأرجح خطأ برمجي في كود JavaScript.";
        statusDiv.style.backgroundColor = '#2ecc71';
        statusDiv.style.color = 'white';
    } else {
        statusDiv.innerHTML = `فشل: لم يتم العثور على العناصر التالية:<br><strong>${missingElements.join(', ')}</strong><br>تأكد من أن ملف index.html محدث ومطابق لملف script.js.`;
        statusDiv.style.backgroundColor = '#e74c3c';
        statusDiv.style.color = 'white';
    }
});
