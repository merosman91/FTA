// البناء خطوة بخطوة: الخطوة 3 - عرض الأفراد على الشجرة

document.addEventListener('DOMContentLoaded', () => {

    // --- بيانات التطبيق (State) ---
    let familyData = { members: [], nextId: 1 };

    // --- عناصر DOM ---
    const addBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const memberForm = document.getElementById('member-form');
    const closeBtns = document.querySelectorAll('.close-btn');
    const emptyState = document.getElementById('empty-state');
    const treeSvg = d3.select("#tree-svg"); // استخدام D3 لاختيار الـ SVG

    // --- دالة مساعدة جديدة: حساب العمر ---
    function calculateAge(member) {
        if (!member.birthYear) return '';
        const endYear = member.deathYear || new Date().getFullYear();
        const age = endYear - member.birthYear;
        return member.deathYear ? `${age} (تُوفي)` : `${age} عامًا`;
    }

    // --- وظيفة الرسم (الجديدة) ---
    function renderTree() {
        console.log("جاري رسم الشجرة...");
        treeSvg.selectAll("*").remove();
        if (familyData.members.length === 0) return;
        
        const nodes = treeSvg.selectAll("g")
            .data(familyData.members)
            .enter()
            .append("g") // نضيف كل دائرة داخل مجموعة (g) لتسهيل التعامل معها
            .attr("transform", (d, i) => `translate(${50 + i * 150}, 100)`); // وضع الأفراد في صف أفقي

        nodes.append("circle")
            .attr("r", 30)
            .style("fill", d => d.gender === 'male' ? '#3498db' : '#e91e63')
            .style("stroke", '#2c3e50')
            .style("stroke-width", 3);

        nodes.append("text")
            .text(d => d.name)
            .attr("text-anchor", "middle")
            .attr("dy", 5) // محاذاة النص في منتصف الدائرة
            .style("fill", "white")
            .style("font-weight", "bold");

        // --- إضافة نص العمر ---
        nodes.append("text")
            .text(d => calculateAge(d))
            .attr("text-anchor", "middle")
            .attr("dy", 65) // وضع العمر تحت الاسم
            .style("font-size", "12px")
            .style("fill", "#555");
    }

    // --- وظائف التحكم في الواجهة ---
    function checkUIState() {
        console.log("تحديث حالة الواجهة. عدد الأفراد:", familyData.members.length);
        if (familyData.members.length === 0) {
            emptyState.style.display = 'flex';
            treeSvg.node().style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            treeSvg.node().style.display = 'block';
            renderTree(); // استدعاء دالة الرسم عند وجود أفراد
        }
    }

    // --- معالجات الأحداث ---
    addBtn.addEventListener('click', () => { memberModal.style.display = 'block'; });
    shareBtn.addEventListener('click', () => { alert("زر المشاركة يعمل!"); });
    closeBtns.forEach(btn => { btn.addEventListener('click', () => { memberModal.style.display = 'none'; }); });
    window.addEventListener('click', (event) => { if (event.target === memberModal) { memberModal.style.display = 'none'; } });

    memberForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(memberForm);
        const newMember = {
            id: familyData.nextId++,
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthYear: parseInt(formData.get('birth-year')) || null,
            deathYear: parseInt(formData.get('death-year')) || null,
            story: formData.get('story'),
        };
        familyData.members.push(newMember);
        console.log("تمت إضافة عضو جديد:", newMember);
        memberForm.reset();
        memberModal.style.display = 'none';
        checkUIState(); // تحديث الواجهة سيؤدي إلى استدعاء renderTree
    });

    // --- الإعداد الأولي ---
    checkUIState();

});
