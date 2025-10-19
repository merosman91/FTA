// البناء خطوة بخطوة: الخطوة 2 - حفظ بيانات النموذج

document.addEventListener('DOMContentLoaded', () => {

    console.log("تم تحميل الصفحة. بدء بناء التطبيق خطوة بخطوة...");

    // --- بيانات التطبيق (State) ---
    // هنا سنحتفظ ببيانات العائلة في الذاكرة
    let familyData = {
        members: [],
        nextId: 1 // لإنشاء معرفات فريدة لكل فرد
    };

    // --- عناصر DOM ---
    const addBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const memberForm = document.getElementById('member-form');
    const closeBtns = document.querySelectorAll('.close-btn');

    // --- معالجات الأحداث ---
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            memberModal.style.display = 'block';
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            alert("زر المشاركة يعمل!");
        });
    }

    closeBtns.forEach(btn => { btn.addEventListener('click', () => { memberModal.style.display = 'none'; }); });
    window.addEventListener('click', (event) => { if (event.target === memberModal) { memberModal.style.display = 'none'; } });

    // --- الحدث الأهم: حفظ بيانات النموذج ---
    memberForm.addEventListener('submit', (event) => {
        // 1. منع إعادة تحميل الصفحة
        event.preventDefault();
        console.log("تم إرسال النموذج! جاري حفظ البيانات...");

        // 2. قراءة البيانات من حقول النموذج
        const formData = new FormData(memberForm);
        const newMember = {
            id: familyData.nextId++, // إعطاء معرف فريد
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthYear: parseInt(formData.get('birth-year')) || null,
            deathYear: parseInt(formData.get('death-year')) || null,
            story: formData.get('story'),
            // سنضيف الصورة لاحقًا
        };

        // 3. إضافة العضو الجديد إلى قائمة العائلة
        familyData.members.push(newMember);
        console.log("تمت إضافة عضو جديد:", newMember);
        console.log("قائمة العائلة الحالية:", familyData);

        // 4. إعادة تعيين النموذج وإغلاق النافذة
        memberForm.reset();
        memberModal.style.display = 'none';
    });

    console.log("اكتمل الإعداد الأساسي للواجهة.");
});
