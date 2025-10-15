// الخطوة 3: حفظ بيانات الفرد وإدارة حالة الواجهة

console.log("ملف script.js تم تحميله بنجاح!");

document.addEventListener('DOMContentLoaded', () => {

    console.log("تم تحميل محتوى الصفحة بالكامل!");

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
    const emptyState = document.getElementById('empty-state');
    const treeSvg = document.getElementById('tree-svg');

    // --- وظائف التحكم في الواجهة ---
    function checkUIState() {
        console.log("تحديث حالة الواجهة. عدد الأفراد:", familyData.members.length);
        if (familyData.members.length === 0) {
            // إذا لم يكن هناك أفراد، أظهر رسالة الترحيب
            emptyState.style.display = 'flex';
            treeSvg.style.display = 'none';
        } else {
            // إذا كان هناك أفراد، أظهر منطقة الشجرة
            emptyState.style.display = 'none';
            treeSvg.style.display = 'block';
            // في المستقبل، سنقوم هنا برسم الشجرة
        }
    }

    // --- معالجات الأحداث ---

    // فتح نافذة إضافة فرد
    addBtn.addEventListener('click', () => {
        memberModal.style.display = 'block';
    });

    // زر المشاركة
    shareBtn.addEventListener('click', () => {
        alert("زر المشاركة يعمل!");
    });

    // إغلاق النوافذ
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            memberModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === memberModal) {
            memberModal.style.display = 'none';
        }
    });

    // --- الحدث الأهم: حفظ بيانات النموذج ---
    memberForm.addEventListener('submit', (event) => {
        // 1. منع إعادة تحميل الصفحة (السلوك الافتراضي للنماذج)
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

        // 5. تحديث الواجهة لإظهار التغييرات
        checkUIState();
    });

    // --- الإعداد الأولي ---
    // عند تحميل الصفحة، تحقق من الحالة الأولية
    checkUIState();

});
