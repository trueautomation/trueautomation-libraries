package io.trueautomation.client.driver;

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

public class TrueAutomationDriver extends RemoteWebDriver
        implements LocationContext, HasTouchScreen, WebStorage, NetworkConnection {
    public static final String REMOTE_URL_CAPABILITY = "taRemoteUrl";

    private RemoteLocationContext locationContext;
    private RemoteWebStorage webStorage;
    private TouchScreen touchScreen;
    private RemoteNetworkConnection networkConnection;

    public TrueAutomationDriver() { this(TrueAutomationService.createDefaultService(), new ChromeOptions()); }

    public TrueAutomationDriver(TrueAutomationService service) {
        this(service, new ChromeOptions());
    }

    public TrueAutomationDriver(Capabilities capabilities) {
        this(TrueAutomationService.createDefaultService(), capabilities);
    }

    public TrueAutomationDriver(final URL remoteUrl, Capabilities capabilities) {
        this(TrueAutomationService.createDefaultService(),
            capabilities.merge(new MutableCapabilities(
              new HashMap<String, String>() {{
                put(REMOTE_URL_CAPABILITY, remoteUrl.toString());
              }}
            )));
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
}
