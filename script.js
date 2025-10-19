// الخطوة 4: إنشاء الروابط الأسرية ورسم الشجرة الهرمية

console.log("ملف script.js تم تحميله بنجاح!");

document.addEventListener('DOMContentLoaded', () => {

    // --- بيانات التطبيق (State) ---
    let familyData = { members: [], nextId: 1 };
    let pendingRelationship = null; // لتخزين العلاقة المعلقة

    // --- عناصر DOM ---
    const elements = {
        svg: d3.select("#tree-svg"),
        treeContainer: document.querySelector('.tree-container'),
        emptyState: document.getElementById('empty-state'),
        addMemberBtn: document.getElementById('add-member-btn'),
        shareBtn: document.getElementById('share-btn'),
        memberModal: document.getElementById('member-modal'),
        detailsModal: document.getElementById('details-modal'),
        memberForm: document.getElementById('member-form'),
        modalTitle: document.getElementById('modal-title'),
        closeBtns: document.querySelectorAll('.close-btn'),
        editMemberBtn: document.getElementById('edit-member-btn'),
        deleteMemberBtn: document.getElementById('delete-member-btn'),
        photoInput: document.getElementById('photo'),
        // عناصر التفاصيل
        detailsName: document.getElementById('details-name'),
        detailsPhoto: document.getElementById('details-photo'),
        detailsInfo: document.getElementById('details-info'),
        detailsStory: document.getElementById('details-story'),
        // قائمة السياق
        contextMenu: document.getElementById('context-menu'),
    };

    let currentViewingMemberId = null;

    // --- دوال مساعدة ---
    function findMember(id) { return familyData.members.find(m => m.id === id); }
    function calculateAge(member) {
        if (!member.birthYear) return '';
        const endYear = member.deathYear || new Date().getFullYear();
        const age = endYear - member.birthYear;
        return member.deathYear ? `${age} (تُوفي)` : `${age} عامًا`;
    }
    function buildHierarchy(data) {
        if (data.length === 0) return null;
        const stratify = d3.stratify().id(d => d.id).parentId(d => d.parentId);
        return stratify(data);
    }

    // --- وظائف الواجهة ---
    function checkUIState() {
        if (familyData.members.length === 0) {
            elements.emptyState.style.display = 'flex';
            elements.svg.node().style.display = 'none';
        } else {
            elements.emptyState.style.display = 'none';
            elements.svg.node().style.display = 'block';
            renderTree();
        }
    }
    function openModal(modal) { modal.style.display = 'block'; }
    function closeModal(modal) {
        modal.style.display = 'none';
        elements.memberForm.reset();
        currentViewingMemberId = null;
        pendingRelationship = null; // إعادة تعيين العلاقة المعلقة
    }
    function showDetails(memberId) {
        const member = findMember(memberId); if (!member) return;
        currentViewingMemberId = memberId;
        elements.detailsName.textContent = member.name;
        elements.detailsPhoto.src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=34495e&color=fff&size=100`;
        const info = [`النوع: ${member.gender === 'male' ? 'ذكر' : 'أنثى'}`, `سنة الميلاد: ${member.birthYear || 'غير محدد'}`, `سنة الوفاة: ${member.deathYear || 'على قيد الحياة'}`];
        const age = calculateAge(member); if (age) info.push(`العمر: ${age}`);
        elements.detailsInfo.innerHTML = info.join('<br>');
        elements.detailsStory.textContent = member.story || 'لم تتم إضافة قصة بعد.';
        openModal(elements.detailsModal);
    }

    // --- وظيفة الرسم (تم تحديثها بالكامل) ---
    function renderTree() {
        const width = elements.treeContainer.clientWidth;
        const height = elements.treeContainer.clientHeight;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        elements.svg.selectAll("*").remove();
        elements.svg.attr("width", width).attr("height", height);

        const hierarchyRoot = buildHierarchy(familyData.members);
        if (!hierarchyRoot) return;

        const treeLayout = d3.tree().size([innerHeight, innerWidth]);
        const treeG = elements.svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const treeNodes = treeLayout(hierarchyRoot).descendants();
        const treeLinks = hierarchyRoot.links();

        // رسم الروابط (الخطوط)
        treeG.selectAll(".tree-link").data(treeLinks).enter().append("path").attr("class", "tree-link").attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        // رسم العقد
        const node = treeG.selectAll(".person-node").data(treeNodes).enter().append("g")
            .attr("class", d => `person-node ${d.data.gender}`)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => showContextMenu(event, d.data.id));

        node.append("defs").append("clipPath").attr("id", d => `clip-${d.data.id}`).append("circle").attr("r", 30);
        node.append("image")
            .attr("xlink:href", d => d.data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.data.name)}&background=${d.data.gender === 'male' ? '3498db' : 'e91e63'}&color=fff&size=60`)
            .attr("x", -30).attr("y", -30).attr("width", 60).attr("height", 60)
            .attr("clip-path", d => `url(#clip-${d.data.id})`);
        node.append("circle").attr("r", 30).style("fill", "transparent").style("stroke", '#2c3e50').style("stroke-width", 3);
        node.append("text").text(d => d.data.name).attr("text-anchor", "middle").attr("dy", 45).style("fill", "#34495e").style("font-weight", "bold");
        node.append("text").text(d => calculateAge(d.data)).attr("text-anchor", "middle").attr("dy", 65).style("font-size", "12px").style("fill", "#555");
    }

    // --- وظيفة قائمة السياق (جديدة) ---
    function showContextMenu(event, memberId) {
        event.preventDefault(); // منع القائمة الافتراضية للمتصفح
        elements.contextMenu.style.display = 'block';
        elements.contextMenu.style.left = `${event.pageX}px`;
        elements.contextMenu.style.top = `${event.pageY}px`;

        // حفظ العضو الذي تم النقر عليه لاستخدامه لاحقًا
        elements.contextMenu.dataset.relatedToId = memberId;
    }

    function hideContextMenu() {
        elements.contextMenu.style.display = 'none';
    }

    // --- معالجات الأحداث ---
    elements.addMemberBtn.addEventListener('click', () => {
        pendingRelationship = null; // إضافة فرد عادي بدون علاقة
        elements.modalTitle.textContent = 'إضافة فرد جديد';
        openModal(elements.memberModal);
    });

    // معالج النقر على أزرار قائمة السياق
    elements.contextMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const relationType = e.target.dataset.relation;
            const relatedToId = parseInt(elements.contextMenu.dataset.relatedToId);
            
            pendingRelationship = { type: relationType, relatedToId: relatedToId };
            
            hideContextMenu();
            elements.modalTitle.textContent = `إضافة ${e.target.textContent}`;
            openModal(elements.memberModal);
        }
    });

    elements.memberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(elements.memberForm);
        let photoDataUrl = null;
        if (elements.photoInput.files[0]) {
            photoDataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(elements.photoInput.files[0]);
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
            parentId: null, spouseId: null
        };

        // تطبيق العلاقة المعلقة
        if (pendingRelationship) {
            const relatedMember = findMember(pendingRelationship.relatedToId);
            if (relatedMember) {
                if (pendingRelationship.type === 'spouse') {
                    newMember.spouseId = pendingRelationship.relatedToId;
                    relatedMember.spouseId = newMember.id;
                } else {
                    newMember.parentId = pendingRelationship.relatedToId;
                }
            }
        }
        
        familyData.members.push(newMember);
        closeModal(elements.memberModal);
        checkUIState();
    });

    elements.editMemberBtn.addEventListener('click', () => { /* ... يمكن إضافته لاحقًا ... */ });
    elements.deleteMemberBtn.addEventListener('click', () => { /* ... يمكن إضافته لاحقًا ... */ });

    elements.closeBtns.forEach(btn => { btn.addEventListener('click', () => closeModal(btn.closest('.modal')); });
    window.addEventListener('click', (e) => { if (e.target === elements.memberModal) closeModal(elements.memberModal); if (e.target === elements.detailsModal) closeModal(elements.detailsModal); });
    // إخفاء القائمة السياقية عند النقر في أي مكان آخر
    document.addEventListener('click', (e) => { if (!elements.contextMenu.contains(e.target)) hideContextMenu(); });

    // --- الإعداد الأولي ---
    checkUIState();
});
