import { SidePageQuestController } from "../../escape-from-tarkov/page/controller/SidePageQuestController";
import { I18nHelper } from "../../locale/I18nHelper";
import { ExternalLinkController } from "../../warning/ExternalLinkController";
import { AccountServiceBase } from "../services/tebex/account-service";
import { CheckoutServiceBase } from "../services/tebex/checkout-service";
import { StorePackagesServiceBase } from "../services/tebex/store-packages-service";
import { SubscriptionStatus, SubscriptionStatusServiceBase } from "../services/tebex/subscription-status-service";
import { SubscriptionHelper } from "./SubscriptionHelper";

export class SubscriptionPageHandler {
    private static packageService: StorePackagesServiceBase;
    private static checkoutService: CheckoutServiceBase;
    private static subStatusService: SubscriptionStatusServiceBase;
    private static accountService: AccountServiceBase;
    private static boundRoot: HTMLElement | null = null;

    public static init(packageService:StorePackagesServiceBase, checkoutService:CheckoutServiceBase, 
            subStatusService:SubscriptionStatusServiceBase, account: AccountServiceBase) {
        this.packageService = packageService;
        this.checkoutService = checkoutService;
        this.subStatusService = subStatusService;
        this.accountService = account;
        this.bindToDom();
    }

    static bindToDom() {
        if(!this.packageService || !this.checkoutService || !this.subStatusService || !this.accountService) {
            return;
        }
        const subscriptionWindow = document.getElementById("subscription-window-container");
        if(!subscriptionWindow) {
            return;
        }
        if(this.boundRoot && this.boundRoot.isConnected && this.boundRoot === subscriptionWindow) {
            return;
        }
        this.boundRoot = subscriptionWindow;
        this.initSubscriptionCards(this.packageService);
        this.registerDisplaySubscriptionPage(
            this.packageService,
            this.checkoutService,
            this.subStatusService,
            this.accountService
        );
        this.applyLoggedInState();
        this.applyCurrentStatus();
    }

    private static applyLoggedInState() {
        const currentlyLoggedIn = document.getElementById('loggedIn');
        if (!currentlyLoggedIn) {
            return;
        }
        const currentUser = this.accountService?.GetCurrentUser?.();
        if (currentUser?.displayName) {
            currentlyLoggedIn.className = "";
            currentlyLoggedIn.classList.add("loggedIn");
            currentlyLoggedIn.textContent = currentUser.displayName;
        } else {
            currentlyLoggedIn.className = "";
            currentlyLoggedIn.classList.add("not-logged-in-text");
            currentlyLoggedIn.textContent = I18nHelper.get("pages.subscription.state.notLoggedIn");
        }
    }

    private static applyCurrentStatus() {
        const currentStatus = this.subStatusService?.GetCurrentStatus?.();
        if(currentStatus && (currentStatus.state === "ACTIVE" || currentStatus.state === "PENDING_CANCELLATION")) {
            this.activeSubscriptionHeader(
                this.packageService.getPackageFromId(currentStatus.packageId.toString()).name
            );
            this.showSubscriptionStatus(currentStatus);
            this.activateSubscriptionCard(document.getElementById(currentStatus.packageId.toString()));
            this.deactivateInactiveCards();
            SubscriptionHelper.isSubscribedHandler();
        } else {
            SubscriptionHelper.isNotSubscribeHandler();
            this.hideSubscriptionStatus();
            this.defaultSubscriptionHeader();
            this.deactivateAllCards();
            this.resetSubsciptionCards();
            if(this.accountService?.GetCurrentUser?.()) {
                this.clearActivationCards();
            }
        }
        SidePageQuestController.subsriptionChanged();
    }

    private static initSubscriptionCards(packageService:StorePackagesServiceBase) {
        const subsciptionCards:HTMLCollectionOf<Element> = document.getElementsByClassName("subscription-plan")
        const packages = packageService.GetCurrentPackages()
        for(let i = 0; i < subsciptionCards.length; i++) {
            const card:HTMLDivElement = subsciptionCards[i] as HTMLDivElement
            card.id = packages[i].id.toString()
            card.getElementsByClassName("sub-title")[0].textContent = packages[i].name
            // card.getElementsByClassName("sub-description")[0].textContent = packages[i].description.replace("<p>", "").replace("</p>", "")
            const priceEl = card.getElementsByClassName("sub-price")[0];
            const priceMonthEl = card.getElementsByClassName("sub-price-month")[0] as HTMLElement | undefined;
            const packageName = packages[i].name.toLocaleLowerCase();
            card.classList.remove("sub-yearly");
            if(packageName.includes("vip")) {
                priceEl.textContent = packages[i].base_price.toString() + "$ / mo"
                if(priceMonthEl) {
                    priceMonthEl.textContent = "";
                    priceMonthEl.classList.remove("sub-price-month-visible");
                }
            } else if(packageName.includes("yearly")) {
                priceEl.textContent = packages[i].base_price.toString() + "$ / year"
                if(priceMonthEl) {
                    const yearlyPrice = Number(packages[i].base_price);
                    if(Number.isFinite(yearlyPrice)) {
                        const perMonth = yearlyPrice / 12;
                        const formatted = Number.isInteger(perMonth) ? perMonth.toString() : perMonth.toFixed(2);
                        priceMonthEl.textContent = `${formatted}$ / mo`;
                        priceMonthEl.classList.add("sub-price-month-visible");
                    } else {
                        priceMonthEl.textContent = "";
                        priceMonthEl.classList.remove("sub-price-month-visible");
                    }
                }
                card.classList.add("sub-yearly");
            } else if(packageName.includes("lifetime")) {
                priceEl.textContent = packages[i].base_price.toString() + "$ / life"
                if(priceMonthEl) {
                    priceMonthEl.textContent = "";
                    priceMonthEl.classList.remove("sub-price-month-visible");
                }
            }
        }
    }

    static openPage() {
        const pageLoader = (window as any).__pageLoader;
        if(pageLoader?.hasLoader?.("subscription")) {
            pageLoader.loadPage("subscription");
            return;
        }
        const subscriptionWindow = document.getElementById("subscription-window-container")
        if(subscriptionWindow) {
            subscriptionWindow.style.display = "flex"
        }
        const list = document.getElementsByClassName("main-runner-container");
        for(const el of list) {
            if(el instanceof HTMLElement) {
                el.style.display = "none";
            }
        }

        const gif = document.getElementById("subscribers-feature-gif-image");
        if(gif && gif instanceof HTMLImageElement) {
            gif.src = "https://assets.arc-raiders-companion.ca/art/subscription/subscription-gif.gif";
        }
    }
    
    private static registerDisplaySubscriptionPage(packageService:StorePackagesServiceBase, 
            checkoutService:CheckoutServiceBase, subStatusService:SubscriptionStatusServiceBase, account: AccountServiceBase,) {

        const manageSub = document.getElementById("manage-subscription-button")
        if(manageSub) {
            manageSub.addEventListener("click", () => {
                console.log("Link Opened: Tebex subscription manager");
                window.open("https://checkout.tebex.io/payment-history", '_blank');
            })
        }

        overwolf.extensions.onAppLaunchTriggered.addListener((data) => {
            console.log(data);
            subStatusService.RefreshStatus();
        });


        // const refreshSub = document.getElementById("refresh-subscription-button")
        // if(refreshSub) {
        //     refreshSub.addEventListener("click", () => {
        //         console.log("Subscription: Refreshed Subscription");    
        //         subStatusService.RefreshStatus();
        //     })
        // }

        const element = document.getElementById("adRemover")
        const subscriptionWindow = document.getElementById("subscription-window-container")
        if(element) {
            element.addEventListener("click", e => {
                SubscriptionPageHandler.openPage();
            })
        }


        const subButton:HTMLButtonElement = document.getElementById("subscribe-button") as HTMLButtonElement
        if(subButton) {
            subButton.disabled = true;
        }

        const pageElements:HTMLCollectionOf<Element> = document.getElementsByClassName("page-icon-container")
        if(pageElements.length > 0) {
            for(const element of pageElements) {
                (element as HTMLElement).addEventListener("click", () => {
                    if(!element.id.includes("subscriptionButton")) {
                        if(subscriptionWindow) {
                            this.exitPage(subscriptionWindow, packageService)
                        }
                    }
                })
            }
        }


        const exitButton = document.getElementById("exitSubscriptionPage");
        if(exitButton && subscriptionWindow) {
            exitButton.addEventListener("click", () => {
                subButton.disabled = true;
                this.exitPage(subscriptionWindow, packageService);
            });
        }

        const subsciptionCards:HTMLCollectionOf<Element> = document.getElementsByClassName("subscription-plan")
        if(subsciptionCards.length > 0) {
            for(let i = 0; i < subsciptionCards.length; i++) {
                (subsciptionCards[i] as HTMLElement).addEventListener("click", () => {
                    if(!subsciptionCards[i].getAttribute("class").includes("sub-active")) {
                        if(subsciptionCards[i].getAttribute("class").includes("sub-deactivated")) {
                            return;
                        }
                        subButton.disabled = false;
                        this.selectSubscriptionCard(packageService, subsciptionCards[i] as HTMLElement)
                    } else {
                        subButton.disabled = true;
                        this.resetSubsciptionCards()
                    }
                })
            }
        }

        const subscriptionButton = document.getElementById("subscribe-button");
        if(subscriptionButton) {
            subscriptionButton.addEventListener("click", () => {
                if(packageService.getCurrentlySelectedPackage()) {
                    checkoutService.RequestCheckout({
                        packageId: packageService.getCurrentlySelectedPackage().id,
                        extra: {
                          discordId: '',
                        },
                      });
                    // checkoutService.RequestCheckout(packageService.getCurrentlySelectedPackage())
                } else {
                    console.log("Subscribe Button Error: No package selected");
                }
            });
        }

        // Handle user change
        account.on('updated', (newUsername) => {
            this.applyLoggedInState();
            subStatusService.RefreshStatus();
        });

        subStatusService.on("updated", (newStatus:SubscriptionStatus) => {
            if(newStatus.state === "ACTIVE" || newStatus.state === 'PENDING_CANCELLATION') {
                this.activeSubscriptionHeader(packageService.getPackageFromId(newStatus.packageId.toString()).name)
                this.showSubscriptionStatus(newStatus);
                this.activateSubscriptionCard(document.getElementById(newStatus.packageId.toString()))
                this.deactivateInactiveCards()
                SubscriptionHelper.isSubscribedHandler()
            } else {
                SubscriptionHelper.isNotSubscribeHandler()
                this.hideSubscriptionStatus();
                this.defaultSubscriptionHeader();
                this.deactivateAllCards()
                this.resetSubsciptionCards()
                if(subButton) {
                    subButton.disabled = true;
                }
                if(account.GetCurrentUser() !== null && account.GetCurrentUser() !== undefined) {
                    this.clearActivationCards();
                }
            }
            SidePageQuestController.subsriptionChanged();
            
            // Dispatch window event for React components (e.g., TradingPage) to listen for subscription changes
            window.dispatchEvent(new CustomEvent('subscription:updated', { detail: newStatus }));
            
            // if(newStatus.length === 0) {
            //     SubscriptionHelper.isNotSubscribeHandler()
            // }
        })
    }

    private static selectSubscriptionCard(packageService:StorePackagesServiceBase, subsciptionCard:HTMLElement) {
        packageService.setCurrentlySelectedPackage(packageService.getPackageFromId(subsciptionCard.id))
        this.resetSubsciptionCards()
        if(subsciptionCard && !subsciptionCard.getAttribute("class").includes("sub-selected")) {
            subsciptionCard.setAttribute("class", subsciptionCard.getAttribute("class") + " sub-selected")
        }
    }

    private static exitPage(subscriptionWindow:HTMLElement, packageService:StorePackagesServiceBase) {
        subscriptionWindow.style.display = "none"
        this.resetSubsciptionCards()
        packageService.setCurrentlySelectedPackage(null)
        const list = document.getElementsByClassName("main-runner-container");
        for(const el of list) {
            if(el instanceof HTMLElement) {
                el.style.display = "";
            }
        }

        const gif = document.getElementById("subscribers-feature-gif-image");
        if(gif && gif instanceof HTMLImageElement) {
            gif.src = "";
        }
    }

    private static resetSubsciptionCards() {
        const subsciptionCards:HTMLCollectionOf<Element> = document.getElementsByClassName("subscription-plan")
        for(let i = 0; i < subsciptionCards.length; i++) {
            subsciptionCards[i].setAttribute("class", subsciptionCards[i].getAttribute("class").replace(" sub-selected", ""))
        }
    }

    private static activeSubscriptionHeader(packageName:string) {
        const subHeader = document.getElementById("sub-header")
        if(subHeader) {
            subHeader.textContent = `${I18nHelper.get("pages.subscription.state.subscribed.title")}: ${packageName}`;
        }
    }

    private static defaultSubscriptionHeader() {
        const subHeader = document.getElementById("sub-header")
        if(subHeader) {
            subHeader.textContent = I18nHelper.get("pages.subscription.state.notSubscribed.title")
        }
    }

    private static showSubscriptionStatus(newStatus:SubscriptionStatus) {
        const text = document.getElementById("current-subscription-status");
        if(text) {
            if(newStatus.state === "ACTIVE") {
                text.textContent = I18nHelper.get("pages.subscription.state.status.active");
                text.style.color = "#89f767";
            } else if(newStatus.state === "PENDING_CANCELLATION") {
                text.textContent = I18nHelper.get("pages.subscription.state.status.cancelled");
                text.style.color = "rgb(247 191 103)";
            } else {
                text.textContent = newStatus.state;
                text.style.color = "#f76767";
            }
            text.style.display = "";
            text.parentElement.style.display = "";
        }
    }

    private static hideSubscriptionStatus() {
        const text = document.getElementById("current-subscription-status");
        if(text) {
            text.textContent = "";
            text.style.display = "none";
            text.parentElement.style.display = "none";
        }
    }

    private static activateSubscriptionCard(subsciptionCard:HTMLElement) {
        this.resetSubsciptionCards()
        if(subsciptionCard && !subsciptionCard.getAttribute("class").includes("sub-active")) {
            subsciptionCard.setAttribute("class", subsciptionCard.getAttribute("class") + " sub-active")
        }
    }

    private static deactivateInactiveCards() {
        const subsciptionCards:HTMLCollectionOf<Element> = document.getElementsByClassName("subscription-plan")
        if(subsciptionCards.length > 0) {
            for(let i = 0; i < subsciptionCards.length; i++) {
                if(!subsciptionCards[i].getAttribute("class").includes("sub-active") && !subsciptionCards[i].getAttribute("class").includes("sub-deactivated")) {
                    subsciptionCards[i].setAttribute("class", subsciptionCards[i].getAttribute("class") + " sub-deactivated")
                }
            }
        }
    }

    private static clearActivationCards() {
        const subsciptionCards:HTMLCollectionOf<Element> = document.getElementsByClassName("subscription-plan")
        if(subsciptionCards.length > 0) {
            for(let i = 0; i < subsciptionCards.length; i++) {
                subsciptionCards[i].setAttribute("class", subsciptionCards[i].getAttribute("class").replace(" sub-deactivated", ""))
            }
        }
    }

    private static deactivateAllCards() {
        const subsciptionCards:HTMLCollectionOf<Element> = document.getElementsByClassName("subscription-plan")
        if(subsciptionCards.length > 0) {
            for(let i = 0; i < subsciptionCards.length; i++) {
                if(!subsciptionCards[i].getAttribute("class").includes("sub-deactivated")) {
                    subsciptionCards[i].setAttribute("class", subsciptionCards[i].getAttribute("class") + " sub-deactivated")
                }
                subsciptionCards[i].setAttribute("class", subsciptionCards[i].getAttribute("class").replace(" sub-active", ""))
            }
        }
    }
    
}