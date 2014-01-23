/*******************************************************************************
 * Copyright (C) 2013 Martin Gill, Anderson Nishihara
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/

/// <reference path="../defs/knockout.d.ts" />
/// <reference path="../storage/storage_browser.ts" />
/// <reference path="../storage/storage_dropbox.ts" />
/// <reference path="../utils/events.ts" />

module TodoTxtJs.View
{
    export interface IThemeDefinition
    {
        name: string;
        file: string;
    }

    export class Options
    {

        public storageOptions : KnockoutObservableArray<StorageProviders.IStorageProvider>;
        public storageInfo : KnockoutObservable<StorageProviders.IStorageProvider>;
        public storage : KnockoutComputed<string>;
        public addCreatedDate : KnockoutObservable<boolean>;
        public addCreatedDateDescription : KnockoutObservable<string>;

        public removeCompletePriority: KnockoutObservable<boolean>;
        public removeCompletePriorityDescription: KnockoutObservable<string>;

        public showStorageControls: KnockoutComputed<boolean>;
        public showImport: KnockoutComputed<boolean>;
        public showExport: KnockoutComputed<boolean>;

        public useGtd: KnockoutObservable<boolean>;
        public useGtdDescription: KnockoutObservable<string>;

        public saveOnChange: KnockoutObservable<boolean>;
        public saveOnChangeDescription: KnockoutObservable<string>;

        public swapSidebarPosition: KnockoutObservable<boolean>;
        public swapSidebarPositionDescription: KnockoutObservable<string>;

        public theme: KnockoutComputed<IThemeDefinition>;
        public themeDescription: string = "The theme to use for this page.";
        public themes: IThemeDefinition[];
        public themeUrl: KnockoutComputed<string>;

        public themeName: KnockoutObservable<string>;

        constructor()
        {
            this.storageOptions = ko.observableArray([
                new TodoTxtJs.StorageProviders.BrowserStorage(),
                new TodoTxtJs.StorageProviders.DropboxStorage()
            ]);

            this.storageInfo = ko.observable(this.storageOptions()[0]);
            this.storage = ko.computed({
                       owner: this,
                       read: () =>
                       {
                           return this.storageInfo().name;
                       }
                   });

            this.addCreatedDate = ko.observable<boolean>(false);
            this.addCreatedDateDescription = ko.observable<string>("Automatically add a start date to new TODOs.");

            this.removeCompletePriority = ko.observable<boolean>(false);
            this.removeCompletePriorityDescription = ko.observable<string>("Compatibility with official apps. Removes the priority from a Todo when it's marked as completed.");

            this.showStorageControls = ko.computed({
                       owner: this,
                       read: ()=>
                       {
                           return this.storageInfo().controls.storage;
                       }
                   });

            this.showImport = ko.computed({
                      owner: this,
                      read: ()=>
                      {
                          return this.storageInfo().controls.imports;
                      }
                   });

            this.showExport = ko.computed({
                      owner: this,
                      read: ()=>
                      {
                          return this.storageInfo().controls.exports;
                      }
            });

            this.useGtd = ko.observable<boolean>(true);
            this.useGtdDescription = ko.observable<string>("Use GTD tags: #inbox, #next, #someday, #maybe, #wait.");

            this.saveOnChange = ko.observable<boolean>(true);
            this.saveOnChangeDescription = ko.observable<string>("Save changes immediatly after you add/remove/edit a Todo.");

            this.swapSidebarPosition = ko.observable<boolean>(false);
            this.swapSidebarPositionDescription = ko.observable<string>("Place the sidebar on the left of the Todo list.");

            this.themes = [
                { name: "Original", file: "simple_default.css" },
                { name: "Solarized Dark", file: "simple_solarized_dark.css" },
                { name: "Solarized Light", file: "simple_solarized_light.css" }
            ];

            this.themeName = ko.observable<string>(this.themes[0].name);
            this.theme = ko.computed({
                owner: this,
                read: ()=>
                {
                    for (var i = 0; i < this.themes.length; i++)
                    {
                        if (this.themes[i].name === this.themeName())
                        {
                            return this.themes[i];
                        }
                    }

                    return undefined;
                }
            });
            this.themeUrl = ko.computed({
                owner: this,
                read: ()=>
                {
                    return "css/" + this.theme().file;
                }
            });
        }

        public save() : void
        {
            var oldOptions : any = {};
            if (window.localStorage["TodoTxtJsOptions"])
            {
                oldOptions = JSON.parse(window.localStorage["TodoTxtJsOptions"]);
            }

            // Just write out everything, it's during loading we're selective
            window.localStorage["TodoTxtJsOptions"] = ko.toJSON(this);
            if (oldOptions.storage !== this.storage() && todoTxtView)
            {
                todoTxtView.load();
            }
        }

        public load() : void
        {
            if (window.localStorage["TodoTxtJsOptions"])
            {
                var options = JSON.parse(window.localStorage["TodoTxtJsOptions"]);

                // Only load actual options, so we don't break the view model

                // Storage
                if (options.hasOwnProperty("storage"))
                {
                    for (var i = 0; i < this.storageOptions().length; i++)
                    {
                        if (this.storageOptions()[i].name === options.storage)
                        {
                            this.storageInfo(this.storageOptions()[i]);
                            break;
                        }
                    }
                }

                // Create Date
                if (options.hasOwnProperty("addCreatedDate"))
                {
                    this.addCreatedDate(options.addCreatedDate);
                }

                // Remove Completed Priority
                if (options.hasOwnProperty("removeCompletePriority"))
                {
                    this.removeCompletePriority(options.removeCompletePriority);
                }

                // Auto-save
                if (options.hasOwnProperty("saveOnChange"))
                {
                    this.saveOnChange(options.saveOnChange);
                }

                //
                if (options.hasOwnProperty("useGtd")) {
                    this.useGtd(options.useGtd);
                }

                // Theme
                if (options.hasOwnProperty("themeName"))
                {
                    // Make sure always have a theme, even if the
                    // saved option is nonsense.
                    for (var i = 0; i < this.themes.length; i++)
                    {
                        if (this.themes[i].name === options.themeName)
                        {
                            this.themeName(options.themeName);
                            break;
                        }
                    }
                }

                // swap Sidebar
                if (options.hasOwnProperty("swapSidebarPosition"))
                {
                    this.swapSidebarPosition(options.swapSidebarPosition);
                }
            }
        }
    }
}

