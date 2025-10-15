// الخطوة 5: إضافة الصور وحساب العمر (مع تحسين مظهر العقد)

console.log("ملف script.js تم تحميله بنجاح!");

document.addEventListener('DOMContentLoaded', () => {

    // --- بيانات التطبيق (State) ---
    let familyData = {
        members: [],
        nextId: 1
    };

    // --- عناصر DOM ---
    const addBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const memberForm = document.getElementById('member-form');
    const closeBtns = document.querySelectorAll('.close-btn');
    const emptyState = document.getElementById('empty-state');
    const treeSvg = d3.select("#tree-svg");
    const photoInput = document.getElementById('photo');

    // --- دالة مساعدة: حساب العمر ---
    function calculateAge(member) {
        if (!member.birthYear) return '';
        const endYear = member.deathYear || new Date().getFullYear();
        const age = endYear - member.birthYear;
        return member.deathYear ? `${age} (تُوفي)` : `${age} عامًا`;
    }

    // --- وظيفة الرسم (تم تحديثها) ---
    function renderTree() {
        console.log("جاري رسم الشجرة...");
        treeSvg.selectAll("*").remove();
        if (familyData.members.length === 0) return;
        
        const nodes = treeSvg.selectAll("g")
            .data(familyData.members)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(${50 + i * 150}, 100)`);

        nodes.append("defs").append("clipPath")
            .attr("id", d => `clip-${d.id}`)
            .append("circle").attr("r", 30);

        nodes.append("image")
            .attr("xlink:href", d => {
                return d.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=${d.gender === 'male' ? '3498db' : 'e91e63'}&color=fff&size=60`;
            })
            .attr("x", -30).attr("y", -30).attr("width", 60).attr("height", 60)
            .attr("clip-path", d => `url(#clip-${d.id})`);

        nodes.append("circle")
            .attr("r", 30)
            .style("fill", "transparent")
            .style("stroke", '#2c3e50')
            .style("stroke-width", 3);

        // --- تحسين عرض الاسم ---
        nodes.append("text")
            .text(d => d.name)
            .attr("text-anchor", "middle")
            .attr("dy", 45) // **تغيير 1: نقل الاسم إلى أسفل الدائرة**
            .style("fill", "#34495e") // **تغيير 2: تغيير اللون إلى لون داكن ليكون واضحًا**
            .style("font-weight", "bold");

        nodes.append("text")
            .text(d => calculateAge(d))
            .attr("text-anchor", "middle")
            .attr("dy", 65)
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
            renderTree();
        }
    }

    // --- معالجات الأحداث ---
    addBtn.addEventListener('click', () => { memberModal.style.display = 'block'; });
    shareBtn.addEventListener('click', () => { alert("زر المشاركة يعمل!"); });
    closeBtns.forEach(btn => { btn.addEventListener('click', () => { memberModal.style.display = 'none'; }); });
    window.addEventListener('click', (event) => { if (event.target === memberModal) { memberModal.style.display = 'none'; } });

    memberForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(memberForm);
        let photoDataUrl = null;
        const photoFile = photoInput.files[0];
        if (photoFile) {
            photoDataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(photoFile);
            });
        }
        const newMember = {
            id: familyData.nextId++,
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthYear: parseInt(formData.get('birth-year')) || null,
            deathYear: parseInt(formData.get('death-year')) || null,
            story: formData.get('story'),
            photo: photoDataUrl,
        };
        familyData.members.push(newMember);
        console.log("تمت إضافة عضو جديد:", newMember);
        memberForm.reset();
        memberModal.style.display = 'none';
        checkUIState();
    });

    // --- الإعداد الأولي ---
    checkUIState();

});
