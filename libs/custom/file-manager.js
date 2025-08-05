class FileManager {
	constructor (modal = true)
	{
		this.isInit = false;
		this.isModal = modal;

		this.modalHtml =
		`
		<div class="modal fade modal-full" id="FileManagerModal" tabindex="-1" role="dialog" aria-labelledby="FileManagerModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-xl modal-dialog-scrollable" role="document">
			<div class="modal-content">
				<div class="modal-header">
				<h5 class="modal-title fw-normal" id="FileManagerModalLabel">File Manager</h5>

				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
					<!-- <span aria-hidden="true"><i class="la la-times la-lg"></i></span> -->
				</button>
				</div>
				<div class="modal-body d-flex justify-content-center align-items-center" style="min-height: 200px;">

					` + this.getLoadingIcon() + `

				</div>
				<div class="modal-footer justify-content-between">

				<div class="align-left">

				</div>

				<div class="align-right">
					<button type="button" class="btn btn-secondary btn-icon me-1" data-bs-dismiss="modal">
						<i class="la la-times"></i>
						<span>Cancel</span>
					</button>
					<button type="button" class="btn btn-primary btn-icon save-btn">
						<i class="la la-check"></i>
						<span>Add selected</span>
					</button>
				</div>
				</div>
			</div>
			</div>
		</div>`;

		this.response = [],
		this.currentPath = '';
		this.breadcrumbsUrls = [];
		this.filemanager = null;
		this.breadcrumbs = null;
		this.fileList = null;
		this.mediaPath = mediaPath;
		this.doclink = doclink ?? window.location.href;
		this.type = "single";
		this.container = document.getElementById("FileManager");
	}

	getLoadingIcon() {
		return `
		<div class="loading-icon text-center">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>`;
	}

	addModalHtml() {
		if (this.isModal) document.body.append(generateElements(this.modalHtml)[0]);
		this.container = document.getElementById("FileManagerModal");
		this.container.querySelector(".save-btn").addEventListener("click", () => this.save());
	}

	open(element, callback) {
		if (element instanceof Element) {
			this.targetInput = element.dataset.targetInput;
			this.targetThumb = element.dataset.targetThumb;
			if (element.dataset.type) {
				this.type = element.dataset.type;
			}
		} else if (element) {
			this.targetInput = element.targetInput;
			this.targetThumb = element.targetThumb;
			if (element.type) {
				this.type = element.type;
			}
		}

		this.callback = callback;
		this.init();

		let modal = bootstrap.Modal.getOrCreateInstance(this.container);
		if (this.isModal) modal.show();
	}

	init() {
		if (!this.isInit) {
			if (this.isModal) this.addModalHtml();
			let self = this;

			// this.initGallery();
			this.isInit = true;

			var ajaxData = {
				mediaPath: this.mediaPath,
				doclink: this.doclink,
				type: this.type,
				targetInput: this.targetInput,
				targetThumb: this.targetThumb
			};
			stAjaxCall('getDocuments', )

			// this.container.querySelector(".filemanager input[type=file]").addEventListener("change", this.onUpload);
			// this.container.querySelector(".filemanager").addEventListener("click", function (e) {
			// 	let element = e.target.closest(".btn-delete");
			// 	if (element) {
			// 		//  self.deleteFile(element);
			// 	} else {
			// 		element = e.target.closest(".btn-rename");
			// 		if (element) {
			// 			//  self.renameFile(element);
			// 		}
			// 	}
			// });

			const event = new CustomEvent( "fileManager:init", {detail: { type:this.type, targetInput:this.targetInput, targetThumb:this.targetThumb, callback:this.callback} });
			window.dispatchEvent(event);
		}
	}
}