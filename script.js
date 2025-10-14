document.addEventListener('DOMContentLoaded', () => {

    // --- فحص أساسي: هل تم تحميل مكتبة D3.js؟ ---
    if (typeof d3 === 'undefined') {
        document.body.innerHTML = `
            <div style="text-align:center; padding: 50px; font-family: 'Tajawal', sans-serif; direction: rtl; color: #e74c3c;">
                <h2>خطأ: لم يتم تحميل مكتبة D3.js</h2>
                <p>يرجى التأكد من أن ملف 'd3.v7.min.js' موجود في نفس المجلد وأنك قمت بتعديل ملف index.html بشكل صحيح.</p>
            </div>`;
        return; // إيقاف باقي الكود
    }

    // =================================================================
    // 1. STATE & DATA (الحالة والبيانات)
    // =================================================================
    let familyData = {
        members: [],
        nextId: 1
    };

    // =================================================================
    // 2. DOM ELEMENTS (عناصر الصفحة)
    // =================================================================
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
        relationToSelect: document.getElementById('relation-to'),
        relationshipOptionsDiv: document.getElementById('relationship-options'),
        closeBtns: document.querySelectorAll('.close-btn'),
        editMemberBtn: document.getElementById('edit-member-btn'),
        deleteMemberBtn: document.getElementById('delete-member-btn'),
        photoInput: document.getElementById('photo'),
        detailsName: document.getElementById('details-name'),
        detailsPhoto: document.getElementById('details-photo'),
        detailsInfo: document.getElementById('details-info'),
        detailsStory: document.getElementById('details-story'),
    };

    let currentViewingMemberId = null;
    let zoomBehavior;

    // =================================================================
    // 3. HELPER FUNCTIONS (دوال مساعدة)
    // =================================================================
    function findMember(id) {
        return familyData.members.find(m => m.id === id);
    }

    function calculateAge(member) {
        if (!member.birthYear) return '';
        const endYear = member.deathYear || new Date().getFullYear();
        const age = endYear - member.birthYear;
        return member.deathYear ? `${age} (تُوفي)` : `${age} عامًا`;
    }

    // =================================================================
    // 4. RENDERING FUNCTION (وظيفة العرض)
    // =================================================================
    function renderTree() {
        const width = elements.treeContainer.clientWidth;
        const height = elements.treeContainer.clientHeight;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        elements.svg.selectAll("*").remove();
        elements.svg.attr("width", width).attr("height", height);

        if (familyData.members.length === 0) return;

        const treeG = elements.svg.append("g").attr("class", "tree-g");
        const treeLayout = d3.tree().size([innerHeight, innerWidth]);

        const dataCopy = JSON.parse(JSON.stringify(familyData.members));
        const roots = dataCopy.filter(d => !d.parentId);
        if (roots.length > 1) {
            const artificialRoot = { id: "root", name: "الجذور", isArtificial: true };
            dataCopy.push(artificialRoot);
            roots.forEach(r => r.parentId = "root");
        }
        const stratify = d3.stratify().id(d => d.id).parentId(d => d.parentId);
        const hierarchyRoot = stratify(dataCopy);

        const treeNodes = treeLayout(hierarchyRoot).descendants();
        const treeLinks = hierarchyRoot.links();
        const displayNodes = treeNodes.filter(d => !d.data.isArtificial);

        treeNodes.forEach(d => {
            const originalMember = findMember(d.data.id);
            if (originalMember && originalMember.manualX !== undefined) {
                d.x = originalMember.manualX;
                d.y = originalMember.manualY;
            }
        });

        treeG.selectAll(".tree-link")
            .data(treeLinks)
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

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

        setupInteractions(treeG);
        centerView(treeG);
    }

    function setupInteractions(treeG) {
        const dragBehavior = d3.drag()
            .on("drag", (event, d) => {
                d.x = event.y;
                d.y = event.x;
                d3.select(event.sourceEvent.target.parentNode).attr("transform", `translate(${d.y},${d.x})`);
                elements.svg.selectAll(".tree-link").attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));
                event.sourceEvent.stopPropagation();
            })
            .on("end", (event, d) => {
                const member = findMember(d.data.id);
                if (member) {
                    member.manualX = d.x;
                    member.manualY = d.y;
                }
            });
        elements.svg.selectAll(".person-node").call(dragBehavior);

        zoomBehavior = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
            treeG.attr("transform", event.transform);
        });
        elements.svg.call(zoomBehavior);
    }

    function centerView(treeG) {
        const treeBoundingBox = treeG.node().getBBox();
        const fullWidth = +elements.svg.attr("width");
        const fullHeight = +elements.svg.attr("height");
        const midX = treeBoundingBox.x + treeBoundingBox.width / 2;
        const midY = treeBoundingBox.y + treeBoundingBox.height / 2;
        const scale = 0.8 / Math.max(treeBoundingBox.width / fullWidth, treeBoundingBox.height / fullHeight);
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
        elements.svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    // =================================================================
    // 5. UI LOGIC (منطق الواجهة)
    // =================================================================
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
        elements.relationshipOptionsDiv.innerHTML = '';
        currentViewingMemberId = null;
    }

    function showDetails(memberId) {
        const member = findMember(memberId);
        if (!member) return;
        currentViewingMemberId = memberId;
        elements.detailsName.textContent = member.name;
        elements.detailsPhoto.src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=34495e&color=fff&size=100`;
        const info = [`النوع: ${member.gender === 'male' ? 'ذكر' : 'أنثى'}`, `سنة الميلاد: ${member.birthYear || 'غير محدد'}`, `سنة الوفاة: ${member.deathYear || 'على قيد الحياة'}`];
        const age = calculateAge(member);
        if (age) info.push(`العمر: ${age}`);
        elements.detailsInfo.innerHTML = info.join('<br>');
        elements.detailsStory.textContent = member.story || 'لم تتم إضافة قصة بعد.';
        openModal(elements.detailsModal);
    }

    function populateRelationSelect() {
        elements.relationToSelect.innerHTML = '<option value="">-- لا شيء (جذر الشجرة) --</option>';
        familyData.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id; option.textContent = member.name;
            elements.relationToSelect.appendChild(option);
        });
    }

    function updateRelationshipOptions() {
        const selectedId = parseInt(elements.relationToSelect.value);
        elements.relationshipOptionsDiv.innerHTML = '';
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
        elements.relationshipOptionsDiv.appendChild(optionsContainer);
    }

    // =================================================================
    // 6. EVENT HANDLERS (معالجات الأحداث)
    // =================================================================
    elements.addMemberBtn.addEventListener('click', () => {
        elements.modalTitle.textContent = 'إضافة فرد جديد';
        document.getElementById('relation-group').style.display = 'block';
        populateRelationSelect();
        openModal(elements.memberModal);
    });

    elements.shareBtn.addEventListener('click', () => { alert('تم نسخ رابط المشاركة!\n(هذه ميزة تجريبية)'); });
    elements.relationToSelect.addEventListener('change', updateRelationshipOptions);

    elements.memberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(elements.memberForm);
        const memberId = parseInt(formData.get('member-id'));
        
        let photoDataUrl = null;
        const photoFile = elements.photoInput.files[0];
        if (photoFile) {
            photoDataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(photoFile);
            });
        }

        const memberData = {
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthYear: parseInt(formData.get('birth-year')) || null,
            deathYear: parseInt(formData.get('death-year')) || null,
            story: formData.get('story'),
            photo: photoDataUrl,
        };

        if (memberId) {
            const memberIndex = familyData.members.findIndex(m => m.id === memberId);
            if (memberIndex !== -1) {
                familyData.members[memberIndex] = { ...familyData.members[memberIndex], ...memberData };
            }
        } else {
            const relationToId = parseInt(formData.get('relation-to'));
            const relationTypeInput = document.querySelector('input[name="dynamic-relation"]:checked');
            const relationType = relationTypeInput ? relationTypeInput.value : null;

            const newMember = { id: familyData.nextId++, ...memberData, parentId: null, spouseId: null };
            familyData.members.push(newMember);

            if (relationToId && relationType) {
                const relative = findMember(relationToId);
                if (relationType === 'spouse') {
                    newMember.spouseId = relationToId;
                    relative.spouseId = newMember.id;
                } else {
                    newMember.parentId = relationToId;
                }
            }
        }
        
        closeModal(elements.memberModal);
        checkUIState();
    });

    elements.editMemberBtn.addEventListener('click', () => {
        if (currentViewingMemberId) {
            const member = findMember(currentViewingMemberId);
            if (!member) return;
            elements.modalTitle.textContent = 'تعديل بيانات الفرد';
            document.getElementById('member-id').value = member.id;
            document.getElementById('name').value = member.name;
            document.getElementById('gender').value = member.gender;
            document.getElementById('birth-year').value = member.birthYear || '';
            document.getElementById('death-year').value = member.deathYear || '';
            document.getElementById('story').value = member.story || '';
            document.getElementById('relation-group').style.display = 'none';
            closeModal(elements.detailsModal);
            openModal(elements.memberModal);
        }
    });

    elements.deleteMemberBtn.addEventListener('click', () => {
        if (currentViewingMemberId && confirm('هل أنت متأكد من حذف هذا الفرد؟')) {
            const memberToDelete = findMember(currentViewingMemberId);
            if (memberToDelete.spouseId) {
                const spouse = findMember(memberToDelete.spouseId);
                if (spouse) spouse.spouseId = null;
            }
            familyData.members = familyData.members.filter(m => m.id !== currentViewingMemberId);
            closeModal(elements.detailsModal);
            checkUIState();
        }
    });

    elements.closeBtns.forEach(btn => { btn.addEventListener('click', () => closeModal(btn.closest('.modal')); });
    window.addEventListener('click', (e) => { if (e.target === elements.memberModal) closeModal(elements.memberModal); if (e.target === elements.detailsModal) closeModal(elements.detailsModal); });
    window.addEventListener('resize', () => { if (familyData.members.length > 0) renderTree(); });

    // =================================================================
    // 7. INITIALIZATION (الإعداد الأولي)
    // =================================================================
    const collaboratorList = document.querySelector('.collaborator-list');
    ["أنت", "خالد أحمد (محرر)"].forEach(name => {
        const div = document.createElement('div'); div.className = 'collaborator'; div.textContent = name;
        collaboratorList.appendChild(div);
    });
    
    checkUIState();
});
