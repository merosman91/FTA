// البناء خطوة بخطوة: الخطوة 4أ - الرسم الهرمي (تم إصلاح العلاقات)

console.log("ملف script.js تم تحميله بنجاح!");

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
    const treeSvg = d3.select("#tree-svg");

    // --- دالة مساعدة: حساب العمر ---
    function calculateAge(member) {
        if (!member.birthYear) return '';
        const endYear = member.deathYear || new Date().getFullYear();
        const age = endYear - member.birthYear;
        return member.deathYear ? `${age} (تُوفي)` : `${age} عامًا`;
    }

    // --- وظيفة بناء التسلسل الهرمي ---
    function buildHierarchy(data) {
        if (data.length === 0) return null;
        const stratify = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId);
        return stratify(data);
    }

    // --- وظيفة الرسم ---
    function renderTree() {
        console.log("جاري رسم الشجرة الهرمية...");
        const width = treeSvg.node().clientWidth;
        const height = treeSvg.node().clientHeight;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        treeSvg.selectAll("*").remove();
        treeSvg.attr("width", width).attr("height", height);

        const hierarchyRoot = buildHierarchy(familyData.members);
        if (!hierarchyRoot) return;

        const treeLayout = d3.tree().size([innerHeight, innerWidth]);
        const treeG = treeSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const treeNodes = treeLayout(hierarchyRoot).descendants();
        const treeLinks = hierarchyRoot.links();

        // رسم الروابط (الخطوط)
        treeG.selectAll(".tree-link")
            .data(treeLinks)
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        // رسم العقد
        const node = treeG.selectAll(".person-node")
            .data(treeNodes)
            .enter().append("g")
            .attr("class", d => `person-node ${d.data.gender}`)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("r", 30)
            .style("fill", d => d.data.gender === 'male' ? '#3498db' : '#e91e63')
            .style("stroke", '#2c3e50')
            .style("stroke-width", 3);

        node.append("text")
            .text(d => d.data.name)
            .attr("text-anchor", "middle")
            .attr("dy", 45)
            .style("fill", "#34495e")
            .style("font-weight", "bold");

        node.append("text")
            .text(d => calculateAge(d.data))
            .attr("text-anchor", "middle")
            .attr("dy", 65)
            .style("font-size", "12px")
            .style("fill", "#555");
    }

    // --- وظائف التحكم في الواجهة ---
    function checkUIState() {
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
        
        // --- الإصلاح المؤقت: قراءة parentId من حقل القصة ---
        let parentId = null;
        const storyText = formData.get('story');
        if (storyText && storyText.startsWith('parentId:')) {
            parentId = parseInt(storyText.split(':')[1], 10);
        }

        const newMember = {
            id: familyData.nextId++,
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthYear: parseInt(formData.get('birth-year')) || null,
            deathYear: parseInt(formData.get('death-year')) || null,
            story: formData.get('story'),
            photo: null,
            parentId: parentId // **هذا هو السطر المهم**
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
