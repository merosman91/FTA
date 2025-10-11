document.addEventListener('DOMContentLoaded', () => {

    // --- 1. هيكل البيانات ---
    let familyData = {
        members: [],
        nextId: 1
    };
    
    const collaborators = ["أنت", "خالد أحمد (محرر)"];

    // --- 2. عناصر DOM ---
    const svg = d3.select("#tree-svg");
    const treeContainer = document.querySelector('.tree-container');
    const emptyState = document.getElementById('empty-state');
    const addMemberBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const detailsModal = document.getElementById('details-modal');
    const memberForm = document.getElementById('member-form');
    const modalTitle = document.getElementById('modal-title');
    const relationToSelect = document.getElementById('relation-to');
    const relationshipOptionsDiv = document.getElementById('relationship-options');
    const closeBtns = document.querySelectorAll('.close-btn');
    const editMemberBtn = document.getElementById('edit-member-btn');
    const deleteMemberBtn = document.getElementById('delete-member-btn');
    const photoInput = document.getElementById('photo');

    let currentEditingMember = null;
    let currentViewingMember = null;
    let currentPhotoDataUrl = null;
    let treeLayout;

    // --- 3. دالة لتحديث أبعاد الشجرة ---
    function updateDimensions() {
        const width = treeContainer.clientWidth;
        const height = treeContainer.clientHeight;
        const margin = {top: 50, right: 50, bottom: 50, left: 50};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        treeLayout = d3.tree().size([innerHeight, innerWidth]);
        svg.attr("width", width).attr("height", height);
    }

    // --- 4. دوال مساعدة ---
    function findMember(id) {
        return familyData.members.find(m => m.id === id);
    }
    function getChildren(parentId) {
        return familyData.members.filter(m => m.parentId === parentId);
    }
    function getSpouse(memberId) {
        const member = findMember(memberId);
        if (!member || !member.spouseId) return null;
        return findMember(member.spouseId);
    }
    function checkUIState() {
        if (familyData.members.length === 0) {
            emptyState.style.display = 'flex';
            svg.style('display', 'none');
        } else {
            emptyState.style.display = 'none';
            svg.style('display', 'block');
            renderTree();
        }
    }

    // --- 5. دالة بناء التسلسل الهرمي ---
    function buildHierarchy(data) {
        if (data.length === 0) return null;
        
        const map = new Map();
        data.forEach(member => {
            map.set(member.id, { ...member, children: [] });
        });

        const roots = [];
        map.forEach((node, id) => {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId).children.push(node);
            } else if (!node.parentId) {
                roots.push(node);
            }
        });

        if (roots.length > 1) {
            const artificialRoot = { name: "الجذور", id: "root", children: roots, isArtificial: true };
            return d3.hierarchy(artificialRoot);
        }
        
        return d3.hierarchy(roots[0]);
    }

    // --- 6. دالة السحب والإفلات ---
    function drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            svg.classed("dragging", true);
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
            // تحديث موقع العقدة أثناء السحب
            d3.select(this).attr("transform", `translate(${d.y},${d.x})`);
            // إعادة رسم الروابط لتتصل بالموقع الجديد
            svg.selectAll(".tree-link").attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            // حفظ الموقع الجديد في بيانات العضو
            const member = findMember(d.data.id);
            if(member) {
                member.manualX = d.x;
                member.manualY = d.y;
            }
            svg.classed("dragging", false);
        }
        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    // --- 7. دالة رسم الشجرة (مع دعم السحب) ---
    function renderTree() {
        svg.selectAll("*").remove();
        updateDimensions();

        const hierarchyRoot = buildHierarchy(familyData.members);
        if (!hierarchyRoot) return;

        const margin = {top: 50, right: 50, bottom: 50, left: 50};
        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const g = svg.append("g");

        const treeNodes = treeLayout(hierarchyRoot).descendants();
        const treeLinks = hierarchyRoot.links();

        // تطبيق المواقع اليدوية إذا كانت موجودة
        treeNodes.forEach(d => {
            const member = findMember(d.data.id);
            if (member && member.manualX !== undefined && member.manualY !== undefined) {
                d.x = member.manualX;
                d.y = member.manualY;
            }
        });

        const displayNodes = treeNodes.filter(d => !d.data.isArtificial);

        const link = g.selectAll(".tree-link")
            .data(treeLinks)
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        const node = g.selectAll(".person-node")
            .data(displayNodes)
            .enter().append("g")
            .attr("class", d => `person-node ${d.data.gender} ${d.data.deathYear ? 'deceased' : ''}`)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => showDetails(d.data.id))
            .call(drag()); // تفعيل السحب والإفلات

        node.append("defs").append("clipPath")
            .attr("id", d => `clip-${d.data.id}`)
            .append("circle").attr("r", 30);

        node.append("image")
            .attr("xlink:href", d => d.data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.data.name)}&background=${d.data.gender === 'male' ? '3498db' : 'e91e63'}&color=fff&size=60`)
            .attr("x", -30).attr("y", -30).attr("width", 60).attr("height", 60)
            .attr("clip-path", d => `url(#clip-${d.data.id})`);
            
        node.append("circle").attr("r", 30).style("fill", "transparent")
            .style("stroke", "#2c3e50").style("stroke-width", 3);

        node.append("text").attr("dy", 50).style("text-anchor", "middle").text(d => d.data.name);

        const treeBoundingBox = g.node().getBBox();
        const dx = (width - treeBoundingBox.width) / 2 - treeBoundingBox.x;
        const dy = (height - treeBoundingBox.height) / 2 - treeBoundingBox.y;
        const finalTransform = `translate(${dx + margin.left}, ${dy + margin.top})`;
        g.attr("transform", finalTransform);
    }

    // --- 8. دوال النوافذ المنبثقة والعلاقات الذكية ---
    function openModal(modal) { modal.style.display = 'block'; }
    function closeModal(modal) {
        modal.style.display = 'none';
        memberForm.reset();
        relationshipOptionsDiv.innerHTML = '';
        currentEditingMember = null; currentViewingMember = null; currentPhotoDataUrl = null;
    }
    
    function populateRelationSelect() {
        relationToSelect.innerHTML = '<option value="">-- لا شيء (جذر الشجرة) --</option>';
        familyData.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id; option.textContent = member.name;
            relationToSelect.appendChild(option);
        });
    }

    function updateRelationshipOptions() {
        const selectedId = parseInt(relationToSelect.value);
        relationshipOptionsDiv.innerHTML = '';
        if (!selectedId) return;

        const relative = findMember(selectedId);
        if (!relative) return;

        const optionsContainer = document.createElement('div');
        const title = document.createElement('h4');
        title.textContent = `ما هي علاقة الشخص الجديد بـ ${relative.name}؟`;
        optionsContainer.appendChild(title);

        const relationships = [];
        if (relative.gender === 'male') {
            relationships.push({ type: 'father', label: 'أبوه' }, { type: 'mother', label: 'أمه' });
            if (!getSpouse(relative.id)) relationships.push({ type: 'spouse', label: 'زوجته' });
        } else {
            relationships.push({ type: 'father', label: 'أبوها' }, { type: 'mother', label: 'أمها' });
            if (!getSpouse(relative.id)) relationships.push({ type: 'spouse', label: 'زوجها' });
        }
        relationships.push({ type: 'son', label: 'ابنه' }, { type: 'daughter', label: 'ابنتها' });

        relationships.forEach(rel => {
            const label = document.createElement('label');
            label.className = 'relationship-option';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'dynamic-relation';
            input.value = rel.type;
            label.appendChild(input);
            label.appendChild(document.createTextNode(rel.label));
            optionsContainer.appendChild(label);
        });
        
        relationshipOptionsDiv.appendChild(optionsContainer);
    }

    function showDetails(memberId) {
        const member = findMember(memberId); if (!member) return;
        currentViewingMember = member;
        document.getElementById('details-name').textContent = member.name;
        document.getElementById('details-photo').src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=34495e&color=fff&size=100`;
        const info = [`النوع: ${member.gender === 'male' ? 'ذكر' : 'أنثى'}`, `سنة الميلاد: ${member.birthYear || 'غير محدد'}`, `سنة الوفاة: ${member.deathYear || 'على قيد الحياة'}`];
        document.getElementById('details-info').innerHTML = info.join('<br>');
        document.getElementById('details-story').textContent = member.story || 'لم تتم إضافة قصة بعد.';
        openModal(detailsModal);
    }
    function openAddModal() {
        modalTitle.textContent = 'إضافة فرد جديد';
        document.getElementById('relation-group').style.display = 'block';
        populateRelationSelect();
        openModal(memberModal);
    }
    function openEditModal(memberId) {
        const member = findMember(memberId); if (!member) return;
        currentEditingMember = member;
        modalTitle.textContent = 'تعديل بيانات الفرد';
        document.getElementById('member-id').value = member.id;
        document.getElementById('name').value = member.name;
        document.getElementById('gender').value = member.gender;
        document.getElementById('birth-year').value = member.birthYear || '';
        document.getElementById('death-year').value = member.deathYear || '';
        document.getElementById('story').value = member.story || '';
        document.getElementById('relation-group').style.display = 'none';
        openModal(memberModal);
    }
    function deleteMember(memberId) {
        if (confirm('هل أنت متأكد من حذف هذا الفرد؟ سيؤثر هذا على الأبناء المرتبطين به.')) {
            const children = getChildren(memberId); children.forEach(child => child.parentId = null);
            const member = findMember(memberId); if(member.spouseId) { const spouse = findMember(member.spouseId); if(spouse) spouse.spouseId = null; }
            familyData.members = familyData.members.filter(m => m.id !== memberId);
            closeModal(detailsModal); checkUIState();
        }
    }

    // --- 9. معالجات الأحداث ---
    addMemberBtn.addEventListener('click', openAddModal);
    shareBtn.addEventListener('click', () => { alert('تم نسخ رابط المشاركة!\n(هذه ميزة تجريبية)'); });
    
    relationToSelect.addEventListener('change', updateRelationshipOptions);

    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (e) => { currentPhotoDataUrl = e.target.result; }; reader.readAsDataURL(file); }
    });

    memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(memberForm);
        
        const name = formData.get('name');
        const gender = formData.get('gender');
        const birthYear = parseInt(formData.get('birth-year')) || null;
        const deathYear = parseInt(formData.get('death-year')) || null;
        const story = formData.get('story');
        const relationToId = parseInt(formData.get('relation-to'));
        // الحصول على نوع العلاقة من الخيار المحدد ديناميكيًا
        const relationTypeInput = document.querySelector('input[name="dynamic-relation"]:checked');
        const relationType = relationTypeInput ? relationTypeInput.value : null;

        if (currentEditingMember) {
            const member = findMember(currentEditingMember.id);
            member.name = name; member.gender = gender; member.birthYear = birthYear; member.deathYear = deathYear; member.story = story;
            if(currentPhotoDataUrl) member.photo = currentPhotoDataUrl;
        } else {
            const newMember = { id: familyData.nextId++, name, gender, birthYear, deathYear, story, photo: currentPhotoDataUrl, parentId: null, spouseId: null };
            if (relationToId && relationType) {
                const relative = findMember(relationToId);
                if (relationType === 'spouse') { newMember.spouseId = relationToId; relative.spouseId = newMember.id; }
                else { newMember.parentId = relationToId; }
            }
            familyData.members.push(newMember);
        }

        closeModal(memberModal);
        checkUIState();
    });

    editMemberBtn.addEventListener('click', () => { if (currentViewingMember) { closeModal(detailsModal); openEditModal(currentViewingMember.id); } });
    deleteMemberBtn.addEventListener('click', () => { if (currentViewingMember) { deleteMember(currentViewingMember.id); } });
    
    closeBtns.forEach(btn => { btn.addEventListener('click', () => { closeModal(btn.closest('.modal')); }); });
    window.addEventListener('click', (e) => { if (e.target === memberModal) closeModal(memberModal); if (e.target === detailsModal) closeModal(detailsModal); });

    window.addEventListener('resize', () => { if (familyData.members.length > 0) { renderTree(); } });

    // --- 10. التشغيل الأولي ---
    const collaboratorList = document.querySelector('.collaborator-list');
    collaborators.forEach(name => { const div = document.createElement('div'); div.className = 'collaborator'; div.textContent = name; collaboratorList.appendChild(div); });
    checkUIState();
});
