export class HelperCreation {

    static createLabel(_id:string, _class:string) {
        let label = document.createElement('label')
        label.setAttribute('id', _id)
        label.setAttribute('class', _class)
        return label
    }

    static createInput(_id:string, _type:string, _class:string): HTMLInputElement {
        let input = document.createElement('input');
        input.setAttribute('id', _id);
        input.setAttribute('type', _type);
        input.setAttribute('class', _class);
        return input;
    }

    static createSpan(_class:string): HTMLElement {
        let span = document.createElement('span');
        span.setAttribute('class', _class);
        return span;
    }

    static createA(_class:string, _text:string): HTMLElement {
        let a: HTMLElement = document.createElement('a');
        a.setAttribute('class', _class);
        a.textContent = _text
        return a
    }

    static createB(_class:string, _text:string): HTMLElement {
        let b: HTMLElement = document.createElement('b');
        b.setAttribute('class', _class);
        b.textContent = _text
        return b
    }

    static createP(_class:string, _text:string): HTMLElement {
        let p: HTMLElement = document.createElement('p');
        p.setAttribute('class', _class);
        p.textContent = _text
        return p
    }

    static createImage(_id: string, _class: string, _src: string, _alt: string): HTMLImageElement {
        let image = document.createElement('img');
        image.setAttribute('id', _id)
        image.setAttribute('class', _class)
        image.setAttribute('src', _src)
        image.setAttribute('alt', _alt)
        return image
    }

    static createButton(_id: string, _type:string, _onclick: string, _class:string, text: string): HTMLButtonElement {
        let button = document.createElement('button')
        button.setAttribute('id', _id);
        button.setAttribute('type', _type);
        button.setAttribute('onClick', _onclick);
        button.setAttribute('class', _class);
        button.setAttribute('style', "")
        button.textContent = text
        return button;
    }

    static createDiv(_id: string, _class: string, _style: string): HTMLDivElement {
        let div = document.createElement('div');
        div.setAttribute("id", _id);
        div.setAttribute("class", _class);
        div.setAttribute("style", _style);
        return div;
    }

    static createDivLineWithCenteredTitle(_id: string, _class: string, _style: string, _title:string) {
        let div = document.createElement('div');
        div.setAttribute("id", _id);
        div.setAttribute("class", _class);
        div.setAttribute("style", _style);
        return div;
    }

    static createUl(_id,_class:string): HTMLElement {
        let ul = document.createElement('ul');
        ul.setAttribute("id", _id)
        ul.setAttribute("class", _class);
        return ul
    }

    static createLi(_id:string, _class:string): HTMLElement {
        let li = document.createElement('li');
        li.setAttribute('id', _id)
        li.setAttribute('class', _class)
        return li
    }

    static createH1(id:string, text:string, _class:string):HTMLElement {
        let h1 = document.createElement("h1") as HTMLHeadElement;
        h1.setAttribute("id", id)
        h1.setAttribute("class", _class)
        h1.textContent = text;
        return h1;
    }

    static createKBD(id:string):HTMLElement {
        let kbd = document.createElement("kbd")
        kbd.setAttribute("id", id)
        return kbd;
    }
    
    static createSelect(id:string, _class:string):HTMLSelectElement {
        let select = document.createElement("select")
        select.setAttribute("id", id)
        select.setAttribute("class", _class)
        return select
    }
}