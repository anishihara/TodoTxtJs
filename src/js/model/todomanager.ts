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
/// <reference path="../model/todo.ts" />

module TodoTxtJs
{
    export class TodoManager
    {
        private _nextIndex = 0;
        private _data = ko.observableArray([]);

        public sortTypes: string[] = ["None", "Due Date", "Priority", "Create Date"];
        public primarySort: KnockoutObservable<string>;
        public secondarySort: KnockoutObservable<string>;

        constructor()
        {
            this.primarySort = ko.observable(this.sortTypes[1]);
            this.secondarySort = ko.observable(this.sortTypes[2]);
        }

        public all()
        {
            return this._data().sort(this.sorter);
        }

        public allProjects() : string[]
        {
            var hash = {};
            for (var i = 0; i < this._data().length; i++)
            {
                var projects = this._data()[i].projects();
                for (var j = 0; j < projects.length; j++)
                {
                    hash[projects[j]] = true;
                }
            }

            var result = [];
            for(var name in hash)
            {
                if (hash.hasOwnProperty(name))
                {
                    result.push(name);
                }
            }

            return result;
        }

        public allContexts() : string[]
        {
            var hash = {};
            for (var i = 0; i < this._data().length; i++)
            {
                var contexts = this._data()[i].contexts();
                for (var j = 0; j < contexts.length; j++)
                {
                    hash[contexts[j]] = true;
                }
            }

            var result : string[] = [];
            for(var name in hash)
            {
                if (hash.hasOwnProperty(name))
                {
                    result.push(name);
                }
            }

            return result;
        }

        public allTags(): string[] {
            var hash = {};
            for (var i = 0; i < this._data().length; i++) {
                var tags = this._data()[i].tags();
                for (var j = 0; j < tags.length; j++) {
                    hash[tags[j]] = true;
                }
            }

            var result: string[] = [];
            for (var name in hash) {
                if (hash.hasOwnProperty(name)) {
                    result.push(name);
                }
            }

            return result;
        }

        public remove(index : number) : void
        {
            for (var i = 0; i < this._data().length; i++)
            {
                if (this._data()[i].index === index)
                {
                    this._data.splice(i, 1);
                    return;
                }
            }
        }

        public removeAll() : void
        {
            this._data.removeAll();
            this._nextIndex = 0;
        }

        public add(newTodo: Todo) : void;
        public add(newTodo: string) : void;
        public add(newTodo: any) : void
        {
            var todo: Todo;
            if (typeof(newTodo) === "string")
            {
                todo = new Todo(newTodo);
            }
            else if (newTodo instanceof Todo)
            {
                todo = newTodo;
            }
            else
            {
                throw "Invalid type for new TODO";
            }

            todo.index = this._nextIndex++;
            this._data.push(todo);
        }

        /**
         * Compares two Todo due dates.
         * @param left The "left" todo
         * @param right The "right" todo
         * @returns 0 if equivalent, -1 if right comes before left. 1 if left comes before right.
         */
        private static _compareDueDate(left: Todo, right: Todo): number
        {
            if (left.dueDate() || right.dueDate())
            {
                if (!left.dueDate()) return 1;
                if (!right.dueDate()) return -1;

                if (left.dueDate() !== right.dueDate())
                {
                    return left.dueDate() < right.dueDate() ? -1 : 1;
                }
            }
            return 0;
        }

        /**
         * Compares two Todo create dates.
         * @param left The "left" todo
         * @param right The "right" todo
         * @returns 0 if equivalent, -1 if right comes before left. 1 if left comes before right.
         */
        private static _compareCreateDate(left: Todo, right: Todo): number
        {
            if (left.createdDate() || right.createdDate())
            {
                if (!left.createdDate()) return 1;
                if (!right.createdDate()) return -1;

                if (left.createdDate() !== right.createdDate())
                {
                    return left.createdDate() < right.createdDate() ? -1 : 1;
                }
            }
            return 0;
        }

        /**
         * Compares two Todo priorities.
         * @param left The "left" todo
         * @param right The "right" todo
         * @returns 0 if equivalent, -1 if right comes before left. 1 if left comes before right.
         */
        private static _comparePriority(left: Todo, right: Todo): number
        {
            // Now we check on priority
            if (left.priorityScore() !== right.priorityScore())
            {
                return left.priorityScore() < right.priorityScore() ? -1 : 1;
            }
            return 0;
        }

        /**
         * Compares two Todo based on the given criteria
         * @param left The "left" todo
         * @param right The "right" todo
         * @param sortType @see sortTypes;
         * @returns 0 if equivalent, -1 if right comes before left. 1 if left comes before right.
         * @private
         */
        private static _compareTodo(left: Todo, right: Todo, sortType: string): number
        {
            switch (sortType)
            {
                case "Due Date":
                    return TodoManager._compareDueDate(left, right);
                    break;
                case "Create Date":
                    return TodoManager._compareCreateDate(left, right);
                    break;
                case "Priority":
                    return TodoManager._comparePriority(left, right);
                    break;
                case "None":
                    return 0;
                default:
                    console.warn("Unkown Sort Type: " + sortType);
                    return 0;
            }
        }

        private sorter = (left, right): number =>
        {
            if (left.completed() !== right.completed())
            {
                if (left.completed() && !right.completed())
                {
                    return 1;
                }
                else
                {
                    return -1;
                }
            }

            var result = 0;

            // Due date is more important than priority
            result = TodoManager._compareTodo(left, right, this.primarySort());
            if (result !== 0) return result;

            // Due date is more important than priority
            result = TodoManager._compareTodo(left, right, this.secondarySort());
            if (result !== 0) return result;

            // Run out of significant values so use file order.
            return left.index < right.index ? -1 : 1;
        }

        public addFromStringArray(newData : string[]) : void
        {
            for (var i = 0; i < newData.length; i++)
            {
                var obj = newData[i];
                this.add(obj);
            }
        }

        public loadFromStringArray(newData : string[]) : void
        {
            this.removeAll();
            this.addFromStringArray(newData);
        }

        public exportToStringArray() : string[]
        {
            var sorted = ko.observableArray(this._data());
            sorted.sort(function(left, right) { return left.index - right.index; });

            var result:string[] = [];
            for (var i = 0; i < sorted().length; i++)
            {
                result.push(sorted()[i].text());
            }

            return result;
        }
    }
}
