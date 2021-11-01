/**
 * @name ToggleGameStatus
 * @author Mobiaz
 * @version 1.1.3
 * @description Hides side bars in discord
 * @website https://github.com/ethanhu99
 */

module.exports = (_ => {
	const config = {
		"info": {
			"name": "GameActivityToggle",
			"author": "DevilBro",
			"version": "1.0.4",
			"description": "Adds a Quick-Toggle Game Activity Button"
		},
		"changeLog": {
			"improved": {
				"Cached State": "Now saves the state of your activity status, to avoid the activity status being turned off on each start of discord, this is an issue with Discord btw and not the plugin"
			}
		}
	};

	return (window.Lightcord && !Node.prototype.isPrototypeOf(window.Lightcord) || window.LightCord && !Node.prototype.isPrototypeOf(window.LightCord)) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return "Do not use LightCord!";}
		load () {BdApi.alert("Attention!", "By using LightCord you are risking your Discord Account, due to using a 3rd Party Client. Switch to an official Discord Client (https://discord.com/) with the proper BD Injection (https://betterdiscord.app/)");}
		start() {}
		stop() {}
	} : !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return `The Library Plugin needed for ${config.info.name} is missing. Open the Plugin Settings to download it. \n\n${config.info.description}`;}

		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}

		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var _this;
		var toggleButton;

		const ActivityToggleComponent = class ActivityToggle extends BdApi.React.Component {
			componentDidMount() {
				toggleButton = this;
			}
			render() {
				return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.PanelButton, Object.assign({}, this.props, {
					tooltipText: BDFDB.LibraryModules.SettingsStore.showCurrentGame ? _this.labels.disable_activity : _this.labels.enable_activity,
					icon: iconProps => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, Object.assign({}, iconProps, {
						nativeClass: true,
						width: 20,
						height: 20,
						foreground: BDFDB.disCN.accountinfobuttonstrikethrough,
						name: BDFDB.LibraryModules.SettingsStore.showCurrentGame ? BDFDB.LibraryComponents.SvgIcon.Names.GAMEPAD : BDFDB.LibraryComponents.SvgIcon.Names.GAMEPAD_DISABLED
					})),
					onClick: _ => {
						_this.settings.general[!BDFDB.LibraryModules.SettingsStore.showCurrentGame ? "playEnable" : "playDisable"] && BDFDB.LibraryModules.SoundUtils.playSound(_this.settings.selections[!BDFDB.LibraryModules.SettingsStore.showCurrentGame ? "enableSound" : "disableSound"], .4);
						BDFDB.LibraryModules.SettingsUtils.updateRemoteSettings({showCurrentGame: !BDFDB.LibraryModules.SettingsStore.showCurrentGame});
					}
				}));
			}
		};

		var sounds = [];

		return class GameActivityToggle extends Plugin {
			onLoad () {
				_this = this;

				sounds = [(BDFDB.ModuleUtils.findByString("undeafen", "deafen", "robot_man", "mute", false) || {exports: {keys: (_ => [])}}).exports.keys()].flat(10).filter(n => n).map(s => s.replace("./", "").split(".")[0]).sort();

				this.defaults = {
					general: {
						playEnable:			{value: true,					description: "Play Enable Sound"},
						playDisable:		{value: true,					description: "Play Disable Sound"}
					},
					selections: {
						enableSound:		{value: "stream_started",		description: "Enable Sound"},
						disableSound:		{value: "stream_ended",			description: "Disable Sound"}
					}
				};

				this.patchedModules = {
					after: {
						Account: "render"
					}
				};
			}

			onStart () {
				let cachedState = BDFDB.DataUtils.load(this, "cachedState");
				if (!cachedState.date || (new Date() - cachedState.date) > 1000*60*60*24*3) {
					cachedState.value = BDFDB.LibraryModules.SettingsStore.showCurrentGame;
					cachedState.date = new Date();
					BDFDB.DataUtils.save(cachedState, this, "cachedState");
				}
				else if (cachedState.value != null && cachedState.value != BDFDB.LibraryModules.SettingsStore.showCurrentGame) BDFDB.LibraryModules.SettingsUtils.updateRemoteSettings({showCurrentGame: cachedState.value});

				BDFDB.PatchUtils.patch(this, BDFDB.LibraryModules.SettingsUtils, "updateLocalSettings", {after: e => {
					BDFDB.ReactUtils.forceUpdate(toggleButton);
					BDFDB.DataUtils.save({date: new Date(), value: BDFDB.LibraryModules.SettingsStore.showCurrentGame}, this, "cachedState");
				}});

				BDFDB.PatchUtils.forceAllUpdates(this);
			}

			onStop () {
				BDFDB.PatchUtils.forceAllUpdates(this);
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel;
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
					collapseStates: collapseStates,
					children: _ => {
						let settingsItems = [];

						for (let key in this.defaults.general) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "Switch",
							plugin: this,
							keys: ["general", key],
							label: this.defaults.general[key].description,
							value: this.settings.general[key]
						}));

						for (let key in this.defaults.selections) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "Select",
							plugin: this,
							keys: ["selections", key],
							label: this.defaults.selections[key].description,
							basis: "50%",
							options: sounds.map(o => ({value: o, label: o.split(/[-_]/g).map(BDFDB.LibraryModules.StringUtils.upperCaseFirstChar).join(" ")})),
							value: this.settings.selections[key],
							onChange: value => BDFDB.LibraryModules.SoundUtils.playSound(value, 0.4)
						}));

						return settingsItems;
					}
				});
			}

			processAccount (e) {
				let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {name: "PanelButton"});
				if (index > -1) {
					e.returnvalue.props.className = BDFDB.DOMUtils.formatClassName(e.returnvalue.props.className, BDFDB.disCN._gameactivitytoggleadded);
					children.unshift(BDFDB.ReactUtils.createElement(ActivityToggleComponent, {}));
				}
			}

			setLabelsByLanguage () {
				switch (BDFDB.LanguageUtils.getLanguage().id) {
					default:		// English
						return {
							disable_activity:					"Disable Game Activity",
							enable_activity:					"Enable Game Activity"
						};
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
