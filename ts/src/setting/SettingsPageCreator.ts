import { HelperCreation } from "../escape-from-tarkov/service/MainPageCreator/HelperCreation";

export class SettingsPageCreator {

    private static createTitle(title:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("","setting-title", "");

        const componentWrapper = HelperCreation.createDiv("","component-title-container", "");
        const text = HelperCreation.createP("component-title", title);

        componentWrapper.appendChild(text);
        wrapper.appendChild(componentWrapper);

        return wrapper
    }

    static createDropwdown(title:string, selectorId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("","setting-component", "");
        wrapper.appendChild(this.createTitle(title));

        const settingValue = HelperCreation.createDiv("","setting-value", "");
        const select = HelperCreation.createSelect(selectorId, "centered setting-dropdown")
        settingValue.appendChild(select);

        wrapper.appendChild(settingValue);

        return wrapper;
    }

    static createSlider(title:string, textId:string, _text:string, inputId:string, min:number, max:number, value:number):HTMLElement {
        const wrapper = HelperCreation.createDiv("","setting-component", "");
        wrapper.appendChild(this.createTitle(title));

        const settingValue = HelperCreation.createDiv("","setting-value", "");
        
        const slideWrapper = HelperCreation.createDiv("","slidecontainer", "");

        const input:HTMLInputElement = HelperCreation.createInput(inputId, "range", "setting-slider");
        input.min = String(min);
        input.max = String(max);
        input.value = String(value);
        const text = HelperCreation.createB("opacity-slider-text-value", _text)
        text.id = textId;
        slideWrapper.appendChild(input);
        slideWrapper.appendChild(text)

        settingValue.appendChild(slideWrapper);
        wrapper.appendChild(settingValue);

        return wrapper;
    }

    static createHotkeyButton(wrapperId:string, title:string, buttonId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv(wrapperId,"setting-component", "");
        wrapper.appendChild(this.createTitle(title));

        const settingValue = HelperCreation.createDiv("","setting-value", "");

        const buttonWrapper = HelperCreation.createDiv("","setting-button-container", "");
        const button = HelperCreation.createButton(buttonId, "", "", "setting-button multiple-button", "")
        buttonWrapper.appendChild(button);

        settingValue.appendChild(buttonWrapper);

        wrapper.appendChild(settingValue);

        return wrapper;
    }

    static createButtonSlider(title:string, labelId:string, inputId:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("","setting-component", "");
        wrapper.appendChild(this.createTitle(title));

        const settingValue = HelperCreation.createDiv("","setting-value", "");

        const labelWrapper = HelperCreation.createDiv("","setting-checkbox-container", "");

        const label = HelperCreation.createLabel(labelId, "switch centered checkbox-container");
        const input = HelperCreation.createInput(inputId, "checkbox", "setting-checkbox");
        const span = HelperCreation.createSpan("slider round");
        label.appendChild(input);
        label.appendChild(span);

        labelWrapper.appendChild(label);

        settingValue.appendChild(labelWrapper);

        wrapper.appendChild(settingValue);

        return wrapper;
    }

    static createDoubleButtonOption(title:string, button1Id:string, button1Text:string, button2Id:string, button2Text:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "setting-component", "");
        wrapper.appendChild(this.createTitle(title));

        const settingValue = HelperCreation.createDiv("","setting-value multiple-button-container", "");

        settingValue.appendChild(this.createButtonForMultipleOptions(button1Id, button1Text));
        settingValue.appendChild(this.createButtonForMultipleOptions(button2Id, button2Text));

        wrapper.appendChild(settingValue);

        return wrapper;
    }

    private static createButtonForMultipleOptions(buttonId:string, buttonText:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "setting-button-container", "");

        const button = HelperCreation.createButton(buttonId, "", "", "setting-button multiple-button", buttonText);
        wrapper.appendChild(button);

        return wrapper;
    }

    static createButton(title:string, buttonId:string, buttonText:string):HTMLElement {
        const wrapper = HelperCreation.createDiv("", "setting-component", "");
        wrapper.appendChild(this.createTitle(title));

        const settingValue = HelperCreation.createDiv("","setting-value", "");

        const buttonWrapper = HelperCreation.createDiv("","setting-button-container", "");
        const button = HelperCreation.createButton(buttonId, "", "", "setting-button", buttonText);

        buttonWrapper.appendChild(button);
        settingValue.appendChild(buttonWrapper);

        wrapper.appendChild(settingValue);

        return wrapper;
    }
}