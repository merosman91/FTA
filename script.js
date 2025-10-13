document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. STATE MANAGEMENT (إدارة الحالة)
    // =================================================================
    // كل بيانات التطبيق توجد هنا. لا يتم تعديلها إلا من خلال الدوال المخصصة لذلك.
    let familyData = {
        members: [],
        nextId: 1
    };

    // =================================================================
    // 2. STATE MUTATION FUNCTIONS (وظائف تعديل الحالة)
    // =================================================================
    // هذه هي الدوال الوحيدة المسموح لها بتغيير 'familyData'

    function addMember(memberData) {
        const newMember = {
            id: familyData.nextId++,
            ...memberData,
            parentId: null,
            spouseId: null
        };
        familyData.members.push(newMember);
        return newMember;
    }

    function updateMember(id, memberData) {
        const memberIndex = familyData.members.findIndex(m => m.id === id);
        if (memberIndex !== -1) {
            familyData.members[memberIndex] = { ...familyData.members[memberIndex], ...memberData };
            return familyData.members[memberIndex];
        }
        return null;
    }

    function deleteMember(id) {
        const children = familyData.members.filter(m => m.parentId === id);
        children.forEach(child => child.parentId = null);

        const member = findMemberById(id);
        if (member && member.spouseId) {
            const spouse = findMemberById(member.spouseId);
            if (spouse) spouse.spouseId = null;
        }

        familyData.members = familyData.members.filter(m => m.id !== id);
    }

    // =================================================================
    // 3. RENDERING FUNCTION (وظيفة العرض)
    // =================================================================
    // هذه الدالة مسؤولة عن رسم الشجرة بالكامل بناءً على الحالة الحالية.

    let svg, treeG, zoomBehavior;
    const treeLayout = d3.tree();

    function renderTree() {
        const container = document.querySelector('.tree-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };

        svg = d3.select("#tree-svg")
            .attr("width", width).attr("height", height);

        // مسح كل شيء وإعادة البناء
        svg.selectAll("*").remove();
        treeG = svg.append("g").attr("class", "tree-g");

        if (familyData.members.length === 0) return;

        treeLayout.size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

        const hierarchyRoot = buildHierarchy(familyData.members);
        if (!hierarchyRoot) return;

        const treeNodes = treeLayout(hierarchyRoot).descendants();
        const treeLinks = hierarchyRoot.links();
        const displayNodes = treeNodes.filter(d => !d.data.isArtificial);

        // روابط
        treeG.selectAll(".tree-link")
            .data(treeLinks)
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        // عقد
        const node = treeG.selectAll(".person-node")
            .data(displayNodes)
            .enter().append("g")
            .attr("class", d => `person-node ${d.data.gender} ${d.data.deathYear ? 'deceased' : ''}`)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => showDetails(d.data.id));

        node.append("defs").append("clipPath").attr("id", d => `clip-${d.data.id}`).append("circle").attr("r", 30);
        node.append("image")
            .attr("xlink:href", d => d.data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.data.name)}&background=${d.data.gender === 'male' ? '3498db' : 'e91e63'}&color=fff&size=60`)
            .attr("x", -30).attr("y", -30).attr("width", 60).attr("height", 60)
            .attr("clip-path", d => `url(#clip-${d.data.id})`);
        node.append("circle").attr("r", 30).style("fill", "transparent").style("stroke", "#2c3e50").style("stroke-width", 3);
        node.append("text").attr("dy", 50).style("text-anchor", "middle").text(d => d.data.name);
        node.append("text").attr("dy", 65).style("text-anchor", "middle").style("font-size", "12px").style("fill", "#555").text(d => calculateAge(d.data));
        
        // إعداد السحب والتكبير
        setupInteractivity();
        centerView();
    }
    
    function setupInteractivity() {
        // السحب والإفلات للعقد
        const dragBehavior = d3.drag()
            .on("drag", (event, d) => {
                d.x = event.y;
                d.y = event.x;
                d3.select(event.sourceEvent.target.parentNode).attr("transform", `translate(${d.y},${d.x})`);
                svg.selectAll(".tree-link").attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));
                event.sourceEvent.stopPropagation();
            })
            .on("end", (event, d) => {
                updateMember(d.data.id, { manualX: d.x, manualY: d.y });
            });
        
        svg.selectAll(".person-node").call(dragBehavior);

        // التكبير والتصغير للشجرة
        zoomBehavior = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
            treeG.attr("transform", event.transform);
        });
        svg.call(zoomBehavior);
    }

    function centerView() {
        if (!treeG) return;
        const treeBoundingBox = treeG.node().getBBox();
        const fullWidth = +svg.attr("width");
        const fullHeight = +svg.attr("height");
        const midX = treeBoundingBox.x + treeBoundingBox.width / 2;
        const midY = treeBoundingBox.y + treeBoundingBox.height / 2;
        const scale = 0.8 / Math.max(treeBoundingBox.width / fullWidth, treeBoundingBox.height / fullHeight);
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    // =================================================================
    // 4. UI LOGIC & HELPERS (منطق الواجهة المساعد)
    // =================================================================
    
    function findMemberById(id) {
        return familyData.members.find(m => m.id === id);
    }

    function calculateAge(member) {
        if (!member.birthYear) return '';
        const endYear = member.deathYear || new Date().getFullYear();
        const age = endYear - member.birthYear;
        return member.deathYear ? `${age} (تُوفي)` : `${age} عامًا`;
    }

    function buildHierarchy(data) {
        if (data.length === 0) return null;
        const dataCopy = JSON.parse(JSON.stringify(data));
        const roots = dataCopy.filter(d => !d.parentId);
        if (roots.length > 1) {
            const artificialRoot = { id: "root", name: "الجذور", isArtificial: true };
            dataCopy.push(artificialRoot);
            roots.forEach(r => r.parentId = "root");
        }
        const stratify = d3.stratify().id(d => d.id).parentId(d => d.parentId);
        return stratify(dataCopy);
    }

    let currentPhotoDataUrl = null;
    let currentViewingMemberId = null;

    function checkUIState() {
        const emptyState = document.getElementById('empty-state');
        const svgElement = document.getElementById('tree-svg');
        if (familyData.members.length === 0) {
            emptyState.style.display = 'flex';
            svgElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            svgElement.style.display = 'block';
            renderTree();
        }
    }

    function openModal(modal) { modal.style.display = 'block'; }
    function closeModal(modal) {
        modal.style.display = 'none';
        document.getElementById('member-form').reset();
        document.getElementById('relationship-options').innerHTML = '';
        currentPhotoDataUrl = null;
        currentViewingMemberId = null;
    }

    function showDetails(memberId) {
        const member = findMemberById(memberId);
        if (!member) return;
        currentViewingMemberId = memberId;
        document.getElementById('details-name').textContent = member.name;
        document.getElementById('details-photo').src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=34495e&color=fff&size=100`;
        const info = [`النوع: ${member.gender === 'male' ? 'ذكر' : 'أنثى'}`, `سنة الميلاد: ${member.birthYear || 'غير محدد'}`, `سنة الوفاة: ${member.deathYear || 'على قيد الحياة'}`];
        const age = calculateAge(member);
        if (age) info.push(`العمر: ${age}`);
        document.getElementById('details-info').innerHTML = info.join('<br>');
        document.getElementById('details-story').textContent = member.story || 'لم تتم إضافة قصة بعد.';
        openModal(document.getElementById('details-modal'));
    }

    function populateRelationSelect() {
        const select = document.getElementById('relation-to');
        select.innerHTML = '<option value="">-- لا شيء (جذر الشجرة) --</option>';
        familyData.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id; option.textContent = member.name;
            select.appendChild(option);
        });
    }

    function updateRelationshipOptions() {
        const selectedId = parseInt(document.getElementById('relation-to').value);
        const optionsDiv = document.getElementById('relationship-options');
        optionsDiv.innerHTML = '';
        if (!selectedId) return;

        const relative = findMemberById(selectedId);
        if (!relative) return;

        const optionsContainer = document.createElement('div');
        const title = document.createElement('h4');
        title.textContent = `ما هي علاقة الشخص الجديد بـ ${relative.name}؟`;
        optionsContainer.appendChild(title);

        const relationships = [];
        if (relative.gender === 'male') {
            relationships.push({ type: 'father', label: 'أبوه' }, { type: 'mother', label: 'أمه' });
            if (!relative.spouseId) relationships.push({ type: 'spouse', label: 'زوجته' });
        } else {
            relationships.push({ type: 'father', label: 'أبوها' }, { type: 'mother', label: 'أمها' });
            if (!relative.spouseId) relationships.push({ type: 'spouse', label: 'زوجها' });
        }
        relationships.push({ type: 'son', label: 'ابنه' }, { type: 'daughter', label: 'ابنتها' });

        relationships.forEach(rel => {
            const label = document.createElement('label'); label.className = 'relationship-option';
            const input = document.createElement('input'); input.type = 'radio'; input.name = 'dynamic-relation'; input.value = rel.type;
            label.appendChild(input); label.appendChild(document.createTextNode(rel.label));
            optionsContainer.appendChild(label);
        });
        optionsDiv.appendChild(optionsContainer);
    }

    // =================================================================
    // 5. EVENT HANDLERS (معالجات الأحداث)
    // =================================================================

    document.getElementById('add-member-btn').addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'إضافة فرد جديد';
        document.getElementById('relation-group').style.display = 'block';
        populateRelationSelect();
        openModal(document.getElementById('member-modal'));
    });

    document.getElementById('share-btn').addEventListener('click', () => {
        alert('تم نسخ رابط المشاركة!\n(هذه ميزة تجريبية)');
    });

    document.getElementById('relation-to').addEventListener('change', updateRelationshipOptions);

    document.getElementById('photo').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { currentPhotoDataUrl = e.target.result; };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('member-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const memberId = parseInt(formData.get('member-id'));
        const relationToId = parseInt(formData.get('relation-to'));
        const relationTypeInput = document.querySelector('input[name="dynamic-relation"]:checked');
        const relationType = relationTypeInput ? relationTypeInput.value : null;

        const memberData = {
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthYear: parseInt(formData.get('birth-year')) || null,
            deathYear: parseInt(formData.get('death-year')) || null,
            story: formData.get('story'),
            photo: currentPhotoDataUrl,
        };

        if (memberId) { // Edit mode
            updateMember(memberId, memberData);
        } else { // Add mode
            const newMember = addMember(memberData);
            if (relationToId && relationType) {
                const relative = findMemberById(relationToId);
                if (relationType === 'spouse') {
                    updateMember(newMember.id, { spouseId: relationToId });
                    updateMember(relationToId, { spouseId: newMember.id });
                } else {
                    updateMember(newMember.id, { parentId: relationToId });
                }
            }
        }
        
        currentPhotoDataUrl = null; // Reset photo
        closeModal(document.getElementById('member-modal'));
        checkUIState();
    });

    document.getElementById('edit-member-btn').addEventListener('click', () => {
        if (currentViewingMemberId) {
            const member = findMemberById(currentViewingMemberId);
            if (!member) return;
            document.getElementById('modal-title').textContent = 'تعديل بيانات الفرد';
            document.getElementById('member-id').value = member.id;
            document.getElementById('name').value = member.name;
            document.getElementById('gender').value = member.gender;
            document.getElementById('birth-year').value = member.birthYear || '';
            document.getElementById('death-year').value = member.deathYear || '';
            document.getElementById('story').value = member.story || '';
            document.getElementById('relation-group').style.display = 'none';
            closeModal(document.getElementById('details-modal'));
            openModal(document.getElementById('member-modal'));
        }
    });

    document.getElementById('delete-member-btn').addEventListener('click', () => {
        if (currentViewingMemberId && confirm('هل أنت متأكد من حذف هذا الفرد؟')) {
            deleteMember(currentViewingMemberId);
            closeModal(document.getElementById('details-modal'));
            checkUIState();
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('member-modal')) closeModal(document.getElementById('member-modal'));
        if (e.target === document.getElementById('details-modal')) closeModal(document.getElementById('details-modal'));
    });

    window.addEventListener('resize', () => {
        if (familyData.members.length > 0) {
            renderTree();
        }
    });

    // =================================================================
    // 6. INITIALIZATION (الإعداد الأولي)
    // =================================================================
    const collaboratorList = document.querySelector('.collaborator-list');
    ["أنت", "خالد أحمد (محرر)"].forEach(name => {
        const div = document.createElement('div'); div.className = 'collaborator'; div.textContent = name;
        collaboratorList.appendChild(div);
    });
    
    checkUIState();
});
