// كائن التطبيق الرئيسي
const FamilyTreeApp = {
    // عناصر واجهة المستخدم
    elements: {
        treeDisplay: document.getElementById('treeDisplay'),
        addPersonBtn: document.getElementById('addPersonBtn'),
        emptyStateAddBtn: document.getElementById('emptyStateAddBtn'),
        shareBtn: document.getElementById('shareBtn'),
        exportBtn: document.getElementById('exportBtn'),
        personModal: document.getElementById('personModal'),
        shareModal: document.getElementById('shareModal'),
        closeModal: document.getElementById('closeModal'),
        closeShareModal: document.getElementById('closeShareModal'),
        cancelBtn: document.getElementById('cancelBtn'),
        personForm: document.getElementById('personForm'),
        modalTitle: document.getElementById('modalTitle'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        shareLink: document.getElementById('shareLink'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage'),
        personPhoto: document.getElementById('personPhoto'),
        photoPreview: document.getElementById('photoPreview'),
        personRelation: document.getElementById('personRelation'),
        tooltip: document.querySelector('.tooltip')
    },

    // بيانات شجرة العائلة
    familyTree: {
        nodes: [],
        links: []
    },

    // الحالة الحالية
    state: {
        currentPerson: null,
        currentParentId: null,
        currentPhotoData: null,
        pendingSpouseFor: null
    },

    // تهيئة التطبيق
    init() {
        this.bindEvents();
        this.loadFromLocalStorage();
        this.checkShareLink();
    },

    // ربط الأحداث
    bindEvents() {
        this.elements.addPersonBtn.addEventListener('click', () => this.openPersonModal());
        this.elements.emptyStateAddBtn.addEventListener('click', () => this.openPersonModal());
        this.elements.shareBtn.addEventListener('click', () => this.openShareModal());
        this.elements.exportBtn.addEventListener('click', () => this.exportTree());
        this.elements.closeModal.addEventListener('click', () => this.closePersonModal());
        this.elements.closeShareModal.addEventListener('click', () => this.elements.shareModal.style.display = 'none');
        this.elements.cancelBtn.addEventListener('click', () => this.closePersonModal());
        this.elements.copyLinkBtn.addEventListener('click', () => this.copyShareLink());
        this.elements.personForm.addEventListener('submit', (e) => this.savePerson(e));
        this.elements.personPhoto.addEventListener('change', (e) => this.handlePhotoSelect(e));
    },

    // التعامل مع اختيار الصورة
    handlePhotoSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.state.currentPhotoData = event.target.result;
                this.elements.photoPreview.src = this.state.currentPhotoData;
                this.elements.photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            this.elements.photoPreview.style.display = 'none';
            this.state.currentPhotoData = null;
        }
    },

    // فتح نافذة إضافة/تعديل شخص
    openPersonModal(personId = null, parentId = null, relationType = null) {
        this.state.currentPerson = personId;
        this.state.currentParentId = parentId;
        this.state.currentPhotoData = null;
        
        // إعادة تعيين النموذج
        this.elements.personForm.reset();
        this.elements.photoPreview.style.display = 'none';
        
        if (personId) {
            // تعديل شخص موجود
            const person = this.familyTree.nodes.find(n => n.id === personId);
            if (person) {
                this.elements.modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> تعديل بيانات الشخص';
                document.getElementById('personName').value = person.name;
                document.getElementById('personGender').value = person.gender;
                document.getElementById('personBirthDate').value = person.birthDate || '';
                document.getElementById('personDeathDate').value = person.deathDate || '';
                document.getElementById('personNotes').value = person.notes || '';
                
                if (person.photo) {
                    this.elements.photoPreview.src = person.photo;
                    this.elements.photoPreview.style.display = 'block';
                    this.state.currentPhotoData = person.photo;
                }
            }
        } else {
            // إضافة شخص جديد
            this.elements.modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> إضافة شخص جديد';
            
            // إذا كان هناك نوع علاقة محدد، قم بتعيينه
            if (relationType) {
                document.getElementById('personRelation').value = relationType;
            }
        }
        
        this.elements.personModal.style.display = 'flex';
    },

    // إغلاق نافذة الشخص
    closePersonModal() {
        this.elements.personModal.style.display = 'none';
        this.state.pendingSpouseFor = null;
    },

    // حفظ بيانات الشخص
    savePerson(e) {
        e.preventDefault();
        
        const name = document.getElementById('personName').value;
        const gender = document.getElementById('personGender').value;
        const birthDate = document.getElementById('personBirthDate').value;
        const deathDate = document.getElementById('personDeathDate').value;
        const relation = document.getElementById('personRelation').value;
        const notes = document.getElementById('personNotes').value;
        
        // التحقق من الحقول المطلوبة
        if (!name || !gender) {
            this.showToast('يرجى ملء الحقول المطلوبة');
            return;
        }
        
        if (this.state.currentPerson) {
            // تحديث شخص موجود
            const personIndex = this.familyTree.nodes.findIndex(n => n.id === this.state.currentPerson);
            if (personIndex !== -1) {
                this.familyTree.nodes[personIndex] = {
                    ...this.familyTree.nodes[personIndex],
                    name,
                    gender,
                    birthDate,
                    deathDate,
                    notes,
                    photo: this.state.currentPhotoData || this.familyTree.nodes[personIndex].photo
                };
                this.showToast('تم تحديث بيانات الشخص بنجاح');
            }
        } else {
            // إضافة شخص جديد
            const id = 'person_' + Date.now();
            const newPerson = {
                id,
                name,
                gender,
                birthDate,
                deathDate,
                notes,
                photo: this.state.currentPhotoData
            };
            
            this.familyTree.nodes.push(newPerson);
            
            // إضافة الروابط بناءً على العلاقة
            if (relation === 'husband' || relation === 'wife') {
                // إضافة رابط زواج
                if (this.state.pendingSpouseFor) {
                    this.familyTree.links.push({
                        source: this.state.pendingSpouseFor,
                        target: id,
                        type: 'marriage'
                    });
                    this.state.pendingSpouseFor = null;
                }
            } else if (this.state.currentParentId) {
                // إضافة كابن لشخص موجود
                this.familyTree.links.push({
                    source: this.state.currentParentId,
                    target: id,
                    type: 'parent'
                });
            } else if (relation && this.familyTree.nodes.length > 1) {
                // إضافة بناءً على العلاقة
                this.handleRelation(relation, id);
            }
            
            this.showToast('تمت إضافة الشخص بنجاح');
            
            // إذا كان هذا هو أول شخص، اعرض خيارات الزوج/الزوجة
            if (this.familyTree.nodes.length === 1) {
                setTimeout(() => {
                    this.showSpouseOptions(id);
                }, 500);
            }
        }
        
        this.closePersonModal();
        this.renderTree();
        this.saveToLocalStorage();
    },

    // عرض شجرة العائلة
    renderTree() {
        // إفراغ الحاوية
        d3.select("#treeDisplay").selectAll("*").remove();
        
        if (this.familyTree.nodes.length === 0) {
            this.elements.treeDisplay.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sitemap"></i>
                    <h3>ابدأ بإنشاء شجرة عائلتك</h3>
                    <p>أضف الشخص الأول لتبدأ رحلة بناء شجرة عائلتك</p>
                    <button class="btn" id="emptyStateAddBtn">
                        <i class="fas fa-user-plus"></i> إضافة شخص جديد
                    </button>
                </div>
            `;
            document.getElementById('emptyStateAddBtn').addEventListener('click', () => this.openPersonModal());
            return;
        }
        
        // إعداد SVG
        const container = d3.select("#treeDisplay");
        const width = container.node().getBoundingClientRect().width;
        const height = 600;
        
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        // إضافة مجموعة للرسم مع ترجمة
        const g = svg.append("g")
            .attr("transform", "translate(40,40)");
        
        // إنشاء تخطيط الشجرة
        const treeLayout = d3.tree()
            .size([height - 80, width - 200])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
        
        // تحويل البيانات إلى هيكل شجرة
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => {
                const link = this.familyTree.links.find(l => l.target === d.id && l.type === 'parent');
                return link ? link.source : null;
            })(this.familyTree.nodes);
        
        // حساب المواقع
        treeLayout(root);
        
        // رسم الروابط
        g.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link parent")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));
        
        // رسم العقد
        const node = g.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", d => `node ${d.data.gender}`)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => {
                event.stopPropagation();
                this.openPersonModal(d.data.id);
            });
        
        // إضافة الدوائر للعقد
        node.append("circle")
            .attr("r", 25);
        
        // إضافة النصوص
        node.append("text")
            .attr("dy", 40)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text(d => d.data.name);
        
        // إضافة إمكانية السحب والتحريك
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        
        svg.call(zoom);
    },

    // عرض رسالة إشعار
    showToast(message) {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.classList.add('show');
        
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    },

    // حفظ البيانات في التخزين المحلي
    saveToLocalStorage() {
        try {
            localStorage.setItem('familyTree', JSON.stringify(this.familyTree));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    // تحميل البيانات من التخزين المحلي
    loadFromLocalStorage() {
        try {
            const savedTree = localStorage.getItem('familyTree');
            if (savedTree) {
                this.familyTree = JSON.parse(savedTree);
                this.renderTree();
            }
        } catch (e) {
            console.error('Error loading saved tree:', e);
        }
    },

    // التحقق من وجود رابط مشاركة
    checkShareLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareToken = urlParams.get('share');
        
        if (shareToken) {
            this.showToast('تم تحميل شجرة عائلة مشتركة');
        }
    }
};

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    FamilyTreeApp.init();
});
