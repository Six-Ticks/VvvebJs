/*
VS Code (Monaco) code editor plugin

Overrides the bottom panel code editor (Vvveb.CodeEditor) and the element "Edit code" modal
(Vvveb.ModalCodeEditor) to use Monaco instead of CodeMirror. The css editor is left on CodeMirror.
Include after plugin-codemirror.js in editor.html - comment out the include to switch back to CodeMirror.

Monaco is loaded lazily the first time either editor is opened.
Content is auto formatted when loaded, and <style>/<script> tags are hidden in the editor and added back
(at the end of the body / element) when changes are written to the page.
*/

Vvveb.MonacoLoader = {

	path: "libs/monaco/package/min/vs",
	monaco: false,
	loading: false,
	callbacks: [],

	load: function(callback) {
		if (this.monaco) {
			callback(this.monaco);
			return;
		}

		this.callbacks.push(callback);
		if (this.loading) {
			return;
		}
		this.loading = true;

		let self = this;
		let loader = document.createElement("script");
		loader.src = this.path + "/loader.js";
		loader.onload = function () {
			window.require.config({ paths: { vs: self.path } });
			window.require(["vs/editor/editor.main"], function (monaco) {
				self.monaco = monaco;
				self.loading = false;
				let callbacks = self.callbacks;
				self.callbacks = [];
				callbacks.forEach(cb => cb(monaco));
			});
		};
		loader.onerror = function () {
			self.loading = false;
			self.callbacks = [];
			loader.remove();
			console.error("Monaco editor could not be loaded from " + self.path);
		};
		document.head.appendChild(loader);
	},

	//separate <style>/<script> tags from html so they can be hidden in the editor and added back on write
	splitTags: function(html) {
		let template = document.createElement("template");
		template.innerHTML = html;

		let hidden = [];
		template.content.querySelectorAll("style, script").forEach(e => {
			hidden.push(e.outerHTML);
			e.remove();
		});

		return {
			html: template.innerHTML,
			hidden: hidden.length ? "\n" + hidden.join("\n") : ""
		};
	},

	//unminify using monaco's built in html formatter
	format: function(editor) {
		let action = editor.getAction("editor.action.formatDocument");
		if (!action) {
			return Promise.resolve();
		}
		return action.run();
	},

	options: function() {
		return {
			language: "html",
			theme: "vs-dark",
			automaticLayout: true,
			wordWrap: "on",
			minimap: { enabled: false }
		};
	}
}


Vvveb.CodeEditor = {

	isActive: false,
	settingValue: false,
	editor: false,
	container: false,
	refreshHandler: false,
	hiddenTags: "",

	init: function(doc) {
		let self = this;
		this.isActive = true;

		if (!this.refreshHandler) {
			this.refreshHandler = () => self.setValue();
		}

		//load code on document changes - same handler reference so re-adding on each init is a no-op
		Vvveb.Builder.frameBody.addEventListener("vvveb.undo.add", this.refreshHandler);
		Vvveb.Builder.frameBody.addEventListener("vvveb.undo.restore", this.refreshHandler);

		//load code when a new url is loaded
		Vvveb.Builder.documentFrame.addEventListener("load", this.refreshHandler);

		if (this.editor) {
			this.setValue();
			this.editor.layout();
			return this.editor;
		}

		if (this.container) {
			//still loading
			return;
		}

		document.querySelector("#vvveb-code-editor textarea").style.display = "none";
		this.container = document.createElement("div");
		this.container.id = "vvveb-monaco-editor";
		this.container.style.width = "100%";
		this.container.style.height = "100%";
		document.getElementById("vvveb-code-editor").prepend(this.container);

		Vvveb.MonacoLoader.load(function (monaco) {
			self.editor = monaco.editor.create(self.container, Vvveb.MonacoLoader.options());

			self.editor.onDidChangeModelContent(function () {
				if (self.settingValue) {
					return;
				}
				delay(() => {
					//editor only holds the body content - write it to the body and leave <head> untouched
					//hidden <style>/<script> tags are added back so they are not lost
					Vvveb.Builder.setBodyHtml(self.editor.getValue() + self.hiddenTags);
					//enable save button
					document.querySelectorAll("#top-panel .save-btn").forEach(e => e.removeAttribute("disabled"));
				}, 1000);
			});

			self.setValue();
		});
	},

	setValue: function(value) {
		if (this.isActive != true || !this.editor) {
			return;
		}
		let self = this;
		let scrollTop = this.editor.getScrollTop();
		let split = Vvveb.MonacoLoader.splitTags(Vvveb.Builder.getBodyHtml());
		this.hiddenTags = split.hidden;

		//keep settingValue until formatting finishes so the format edit is not written back to the page
		this.settingValue = true;
		this.editor.setValue(split.html);
		Vvveb.MonacoLoader.format(this.editor).finally(function () {
			self.editor.setScrollTop(scrollTop);
			self.settingValue = false;
		});
	},

	destroy: function(element) {
		this.isActive = false;
	},

	toggle: function() {
		if (this.isActive != true) {
			return this.init();
		}
		this.destroy();
	}
}


// override modal code editor (element "Edit code") to use monaco
Vvveb.ModalCodeEditor.init = function (modal = false, editor = false) {
	let self = this;
	this.modal = document.getElementById("codeEditorModal");
	this.editor = false;
	this.pendingValue = "";
	this.hiddenTags = "";

	let body = this.modal.querySelector(".modal-body");
	body.querySelector("textarea").style.display = "none";
	let container = document.createElement("div");
	container.style.width = "100%";
	container.style.height = "100%";
	body.appendChild(container);

	this.modal.querySelector('.save-btn').addEventListener("click",  function(event) {
		window.dispatchEvent(new CustomEvent("vvveb.ModalCodeEditor.save", {detail: self.getValue()}));
		self.hide();
		return false;
	});

	this.modal.addEventListener("shown.bs.modal", function () {
		if (self.editor) {
			self.editor.layout();
			self.editor.focus();
		}
	});

	Vvveb.MonacoLoader.load(function (monaco) {
		self.editor = monaco.editor.create(container, Vvveb.MonacoLoader.options());
		self.editor.setValue(self.pendingValue);
		Vvveb.MonacoLoader.format(self.editor);
	});
}

Vvveb.ModalCodeEditor.setValue = function (value) {
	if (!this.modal) {
		this.init();
	}
	//enable save button
	document.querySelectorAll("#top-panel .save-btn").forEach(e => e.removeAttribute("disabled"));

	//<style>/<script> tags are hidden in the editor and added back by getValue()
	let split = Vvveb.MonacoLoader.splitTags(value);
	this.hiddenTags = split.hidden;

	//kept until monaco has loaded on first open
	this.pendingValue = split.html;
	if (this.editor) {
		let self = this;
		this.editor.setValue(split.html);
		Vvveb.MonacoLoader.format(this.editor).finally(function () {
			self.editor.setScrollTop(0);
		});
	}
};

Vvveb.ModalCodeEditor.getValue = function (value) {
	let html = this.editor ? this.editor.getValue() : this.pendingValue;
	return html + this.hiddenTags;
};
