class FileManager {
	constructor(modal = true) {
		this.isInit = false;
		this.isModal = modal;
		this.fileUploaded = false;

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
				<div class="modal-body d-flex justify-content-center align-items-center flex-column" style="min-height: 200px;">

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
		this.submitButton = $(this.container).find('.save-btn');
		this.submitButton.attr('disabled', 'disabled');
	}

	lazyLoadImages(scope = this.container) {
		const $scope = $(scope || document);
		const folderUi = this._folderUri || (this._folderUri = this.getFolderIconUri());
		const photoUi  = this._photoUri  || (this._photoUri  = this.getPhotoPlaceholderUri());
		const documentUi   = this._documentUri   || (this._documentUri   = this.getDocumentIconUri());

		// get every container that is in view
		$scope.find('.doc-card').not('.has-file').each(function() {

			// if not visible in viewport of *its scroll container*:
			const $card = $(this);
			const $container = $card.closest('.modal-body').length
				? $card.closest('.modal-body')
				: $(window);

			const containerTop = $container.scrollTop();
			const containerHeight = $container.height();
			if (($card.position().top) < (containerTop - 500) ||
				($card.position().top) > (containerTop + containerHeight + 500)) {
				return; // skip if not in range
			}

			const url = (String($card.data('image') || '')).trim();
			const type = (String($card.data('type') || '')).toLowerCase();
			const $media = $card.find('.media-bg');
			if (!$media.length) return;

			// add the icons for each type first
			if (type === 'folder') {
				$media.css('background-image', `url("${folderUi}")`).data('bgApplied', 1);
				$card.addClass('has-file is-folder');
			} else if (type === 'gallery image' || type === 'image') {
				$media.css('background-image', `url("${photoUi}")`).data('bgApplied', 1);
				$card.addClass('has-file is-image');
			} else if (type === 'document' || type === 'file') {
				$media.css('background-image', `url("${documentUi}")`).data('bgApplied', 1);
				$card.addClass('has-file is-file');
			}
			$card.find('.loading-icon').remove();

			// add the image
			$('<img/>')
				.on('load', function () {
					$media.css('background-image', `url("${url.replace(/"/g, '\\"')}")`).data('bgApplied', 1);
					$card.addClass('has-file');
					$card.find('.placeholder-icon').remove();
				})
				.attr('src', url);
		});
	}

	getLoadingIcon() {
		return `
			<div class="loading-icon text-center">
				<div class="spinner-border text-primary" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		`;
	}

	getFolderIconUri() {
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
				<path fill="#f4c542" d="M4 10a2 2 0 0 1 2-2h13l3 3h20a2 2 0 0 1 2 2v3H4v-6z"/>
				<path fill="#f7d774" d="M4 16h40v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V16z"/>
				<path fill="#d4a72c" d="M4 16h40v2H4z" opacity=".35"/>
			</svg>
		`;
		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	}

	getDocumentIconUri() {
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
				<path fill="#e9ecef" d="M8 2h20l12 12v32a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
				<path fill="#dee2e6" d="M28 2v12h12L28 2z"/>
				<rect x="12" y="20" width="24" height="2" fill="#adb5bd"/>
				<rect x="12" y="26" width="24" height="2" fill="#adb5bd"/>
				<rect x="12" y="32" width="16" height="2" fill="#adb5bd"/>
			</svg>
		`;
		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	}

	getPhotoPlaceholderUri() {
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48">
				<rect x="1.5" y="1.5" width="61" height="45" rx="6" ry="6" fill="#f1f3f5" stroke="#dee2e6"/>
				<circle cx="46" cy="16" r="5" fill="#ced4da"/>
				<path d="M8 38l12-14 9 10 10-12 17 16H8z" fill="#adb5bd"/>
				<rect x="1.5" y="1.5" width="61" height="45" rx="6" ry="6" fill="none" stroke="#ced4da"/>
			</svg>`;
		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	}

	addModalHtml() {
		if (this.isModal) $('body').append(this.modalHtml);
		this.container = document.getElementById('FileManagerModal');
		$(this.container).find('.save-btn').on('click', () => this.submit());
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

	storeFolderId(folderId) {

		// store the last used folder in local storage
		if (folderId) {
			localStorage.setItem('lastUsedFolder', folderId);
		} else {
			localStorage.removeItem('lastUsedFolder');
		}
	}

	getFolderId() {

		// check local storage for the last used folder
		const lastUsedFolder = localStorage.getItem('lastUsedFolder');
		if (lastUsedFolder) {
			return lastUsedFolder;
		}
		return "";
	}

	init() {
		if (!this.isInit) {
			if (this.isModal) this.addModalHtml();

			// load the file manager
			this.loadFolder();
			this.setupListeners();

			this.isInit = true;
			const event = new CustomEvent("fileManager:init", {
				detail: { type: this.type, targetInput: this.targetInput, targetThumb: this.targetThumb, callback: this.callback }
			});
			window.dispatchEvent(event);
		}
	}

	setupListeners() {
		let self = this;
		this.submitButton = $(this.container).find('.save-btn');
		this.submitButton.attr('disabled', 'disabled');

		$(this.container).off('click.fileManager');

		// event listener for folder clicks
		$(this.container).on('click.fileManager', '.is-folder', function (e) {
			e.preventDefault();
			const folderId = $(this).data('id');
			if (folderId) {
				self.loadFolder(folderId);
			}
		});

		// event listener for breadcrumb clicks
		$(this.container).on('click.fileManager', '.breadcrumb-item a', function (e) {
			e.preventDefault();
			const folderId = $(this).data('id');
			if (folderId) {
				self.loadFolder(folderId);
			}
		});

		// event listener for image selection
		$(this.container).on('click.fileManager', '.card-wrap .is-image', function (e) {
			e.preventDefault();
			$(this).toggleClass('selected');

			// unselect other images if in single select mode
			$(self.container).find('.card-wrap .is-image').not(this).each(function() {
				$(this).removeClass('selected');
			});

			// check that at least one image is selected
			const anySelected = $(self.container).find('.card-wrap .is-image.selected').length > 0;
			if (anySelected) {
				self.submitButton.removeAttr('disabled');
			} else {
				self.submitButton.attr('disabled', 'disabled');
			}
		});
	}

	submit() {

		// get the select file
		const selectedFile = $(this.container).find('.card-wrap .is-image.selected').first();
		if (!selectedFile.length) return;

		const src = selectedFile.data('image');

		if (src.indexOf("//") == -1) {
			src = this.mediaPath + src;
		}

		if (this.targetThumb) {
			document.querySelector(this.targetThumb).setAttribute("src", src);
		}

		if (this.callback) {
			this.callback(src);
		}

		if (this.targetInput) {
			let input = document.querySelector(this.targetInput);
			input.value = src;
			const e = new Event("change",{bubbles: true});
			input.dispatchEvent(e);
			//$(this.targetInput).val(src).trigger("change");
		}

		let modal = bootstrap.Modal.getOrCreateInstance(this.container);
		if (this.isModal) modal.hide();
	}

	loadFolder(folder_id = "") {
		let self = this;
		if(folder_id == "") {

			// if no folder ID is provided, use the last used folder from local storage
			folder_id = this.getFolderId();
		}
		var ajaxData = {
			folder: folder_id || '',
		};
		stAjaxCall('getFileManager', ajaxData).then(async (response) => {
			if (response && response.html) {
				const $bodyEl = $(self.container).find('.modal-body');
				$bodyEl.html(response.html);

				// CSS injection
				if (response.css && response.css.length > 0) {
					const body = self.container.querySelector(".modal-body");
					let style = body.querySelector(".filemanager-css");
					if (!style) {
						style = document.createElement("style");
						style.classList.add("filemanager-css");
						body.appendChild(style);
					}
					style.innerHTML = response.css;
				}

				// store the folder ID in local storage
				if (folder_id) {
					self.storeFolderId(folder_id);
				}

				// initialise the file uploader
				this.initUploader();

				// run the initial lazy load function
				this.lazyLoadImages(self.container);
				this.setupListeners();

				// select the parent container of all the cards
				const container = $('.card-wrapper');
				if (container.length) {

					// find the first card that is not a folder
					const firstFile = $('.card-wrapper .card-wrap:not(:has(.is-folder))').first();
					if (firstFile.length) {
						$('<div>').addClass('flex-break').insertBefore(firstFile);
					}
				}

				// when the user scrolls, run the lazy load function
				const $scrollTargets = $(window).add($bodyEl);
				$scrollTargets.off('scroll.fileManager')
					.on('scroll.fileManager', () => this.lazyLoadImages(this.container));

			} else {
				console.error("Error loading file manager:", response);
			}
		}).catch(function (error) {
			console.error("Error loading file manager:", error);
		});
	}

	initUploader() {
		const self = this;

		// toggle the visibility of the upload view
		$('#show-upload-btn').on('click', function() {
			$('#file-upload-view').addClass('is-visible');
		});
		$('#back-to-manager-btn').on('click', function() {
			$('#file-upload-view').removeClass('is-visible');
			if(self.fileUploaded) {
				self.fileUploaded = false;
				self.loadFolder();
			}
		});

		// register plugins
		FilePond.registerPlugin(FilePondPluginImagePreview);
		FilePond.registerPlugin(FilePondPluginImageResize);
		FilePond.registerPlugin(FilePondPluginImageValidateSize);
		FilePond.registerPlugin(FilePondPluginImageTransform);

		// turn input element(s) into a filepond
		$('.st-uploader').filepond();

		// initialise the filepond with custom server options
		$('.st-uploader').filepond({
			allowMultiple: true,
			allowImageValidateSize: true,
			allowImageResize: true,
			imageResizeTargetWidth: 1920,
			imageResizeTargetHeight: 1920,
			imageResizeMode: '	',
			imageResizeUpscale: false,
			imageValidateSizeMaxWidth: 1920,
			imageValidateSizeMaxHeight: 1920,
			server: {
				process: (fieldName, file, metadata, load, error, progress, abort) => {

					// build the endpoint URL
					const urlParams = new URLSearchParams(window.location.search);
					const i = urlParams.get('i');
					const w = urlParams.get('w');
					const rootUrl = window.location.origin + '/';
					const endpoint = rootUrl + 'process/vvveb.php';

					// get the folder id
					const folder_id = this.getFolderId();

					// build the form data
					const formData = new FormData();
					formData.append('i', i);
					formData.append('w', w);
					formData.append('a', 'fileUploaded');
					formData.append('folder', folder_id);
					formData.append(fieldName, file, file.name);

					// run the ajax request
					const request = $.ajax({
						url: endpoint,
						type: 'POST',
						data: formData,
						processData: false,
						contentType: false,
						xhr: function () {

							// allow tracking of the upload progress
							const xhr = new window.XMLHttpRequest();
							xhr.upload.addEventListener('progress', e => {
								if (e.lengthComputable) {
									progress(true, e.loaded, e.total);
								}
							}, false);
							return xhr;
						},
						success: function(response) {
							self.fileUploaded = true;
							load(response);
						},
						error: function(jqXHR, textStatus, errorMessage) {

							// on error, call the 'error' callback with an error message
							console.error('Upload failed:', errorMessage);
							error('Upload failed');
						}
					});

					// return an object with an abort method
					return {
						abort: () => {
							request.abort();
							abort();
						}
					};
				},
				revert: (uniqueFileId, load, error) => {

					// for the revert action, we can use the normal process as no file is included
					stAjaxCall('fileRevert', { id: uniqueFileId }, 'POST')
						.then(response => {
							load();
						})
						.catch(() => {
							error('Could not revert file');
						});
				}
			}
		});

		// listen for addfile event
		$('.st-uploader').on('FilePond:addfile', function(e) {
			console.log('file added event', e);
		});
	}
}