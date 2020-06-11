package io.trueautomation.client.driver;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Map;
import java.util.HashMap;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.html5.*;
import org.openqa.selenium.interactions.HasTouchScreen;
import org.openqa.selenium.interactions.TouchScreen;
import org.openqa.selenium.mobile.NetworkConnection;
import org.openqa.selenium.remote.FileDetector;
import org.openqa.selenium.remote.RemoteTouchScreen;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.html5.RemoteLocationContext;
import org.openqa.selenium.remote.html5.RemoteWebStorage;
import org.openqa.selenium.remote.mobile.RemoteNetworkConnection;
import org.openqa.selenium.remote.service.DriverCommandExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.By;

public class TrueAutomationDriver extends RemoteWebDriver
        implements LocationContext, HasTouchScreen, WebStorage, NetworkConnection {
    public static final String REMOTE_URL_CAPABILITY = "taRemoteUrl";

    private RemoteLocationContext locationContext;
    private RemoteWebStorage webStorage;
    private TouchScreen touchScreen;
    private RemoteNetworkConnection networkConnection;

    private static Capabilities mergeUrl(Capabilities capabilities, final URL remoteUrl) {
        return capabilities.merge(new MutableCapabilities(
            new HashMap<String, String>() {{
                put(REMOTE_URL_CAPABILITY, remoteUrl.toString());
            }}
        ));
    }

    public TrueAutomationDriver() { this(TrueAutomationService.createDefaultService(null), new ChromeOptions()); }

    public TrueAutomationDriver(TrueAutomationService service) {
        this(service, new ChromeOptions());
    }

    public TrueAutomationDriver(Capabilities capabilities) {
        this(TrueAutomationService.createDefaultService(capabilities), capabilities);
    }

    public TrueAutomationDriver(final URL remoteUrl, Capabilities capabilities) {
        this(TrueAutomationService.createDefaultService(mergeUrl(capabilities, remoteUrl)),
            mergeUrl(capabilities, remoteUrl));
    }

    public TrueAutomationDriver(TrueAutomationService service, Capabilities capabilities) {
        super(new DriverCommandExecutor(service), capabilities);
        locationContext = new RemoteLocationContext(getExecuteMethod());
        webStorage = new RemoteWebStorage(getExecuteMethod());
        touchScreen = new RemoteTouchScreen(getExecuteMethod());
        networkConnection = new RemoteNetworkConnection(getExecuteMethod());
    }

    @Override
    public void setFileDetector(FileDetector detector) {
        throw new WebDriverException(
                "Setting the file detector only works on remote webdriver instances obtained " +
                        "via RemoteWebDriver");
    }

    public Location location() {
        return locationContext.location();
    }

    public void setLocation(Location location) {
        locationContext.setLocation(location);
    }

    public LocalStorage getLocalStorage() {
        return webStorage.getLocalStorage();
    }

    public SessionStorage getSessionStorage() {
        return webStorage.getSessionStorage();
    }

    public TouchScreen getTouch() {
        return touchScreen;
    }

    public ConnectionType getNetworkConnection() {
        return networkConnection.getNetworkConnection();
    }

    public ConnectionType setNetworkConnection(ConnectionType connectionType) {
        return networkConnection.setNetworkConnection(connectionType);
    }

    private String readResourceFile(String fileName) throws IOException {
        ClassLoader classLoader = this.getClass().getClassLoader();
        InputStream inputStream = classLoader.getResourceAsStream(fileName);
        InputStreamReader isReader = new InputStreamReader(inputStream);
        BufferedReader reader = new BufferedReader(isReader);
        StringBuffer sb = new StringBuffer();
        String str;
        while((str = reader.readLine())!= null){
           sb.append(str);
        }
        String content = sb.toString();
        return content;
    }

    public WebElement setInnerHTML(WebElement el, String val) throws IOException {
        String setInnerHTML = readResourceFile("setInnerHTML.js");
        JavascriptExecutor js = (JavascriptExecutor) this;
        js.executeScript(setInnerHTML, el, val);
        return el;
    }

    public WebElement setInnerHTML(By selector, String val) throws IOException {
        String setInnerHTML = readResourceFile("setInnerHTML.js");
        WebElement el = this.findElement(selector);
        JavascriptExecutor js = (JavascriptExecutor) this;
        js.executeScript(setInnerHTML, el, val);
        return el;
    }

    private By selector;
    public WebElement setInnerHTML(String using, String locator, String val) throws IOException {
        if (using == "xpath") {
            selector = By.xpath(locator);
        } else if (using == "className") {
            selector = By.className(locator);
        } else if (using == "cssSelector") {
            selector = By.cssSelector(locator);
        } else if (using == "id") {
            selector = By.id(locator);
        } else if (using == "linkText") {
            selector = By.linkText(locator);
        } else if (using == "name") {
            selector = By.name(locator);
        } else if (using == "partialLinkText") {
            selector = By.partialLinkText(locator);
        } else if (using == "tagName") {
            selector = By.tagName(locator);
        }

        String setInnerHTML = readResourceFile("setInnerHTML.js");
        WebElement el = this.findElement(selector);
        JavascriptExecutor js = (JavascriptExecutor) this;
        js.executeScript(setInnerHTML, el, val);
        return el;
    }
}
