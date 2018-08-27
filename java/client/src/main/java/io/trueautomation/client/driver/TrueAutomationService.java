package io.trueautomation.client.driver;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.remote.service.DriverService;

import java.io.File;
import java.io.IOException;

public class TrueAutomationService extends DriverService {

    public TrueAutomationService(File executable, int port, ImmutableList<String> args, ImmutableMap<String, String> environment) throws IOException {
        super(executable, port, args, environment);
    }

    public static TrueAutomationService createDefaultService(Capabilities capabilities) {
        return new Builder(capabilities).usingAnyFreePort().build();
    }

    public static class Builder extends DriverService.Builder<TrueAutomationService, TrueAutomationService.Builder> {

        private String remote = null;
        private String driver = null;
        private String driverVersion = null;
        private static final String REMOTE_URL_CAPABILITY = "taRemoteUrl";
        private static final String DRIVER_CAPABILITY = "driver";
        private static final String DRIVER_VERSION_CAPABILITY = "driver_version";

        public Builder(Capabilities capabilities) {
            super();
            this.remote = (String) capabilities.getCapability(REMOTE_URL_CAPABILITY);
            this.driver = (String) capabilities.getCapability(DRIVER_CAPABILITY);
            this.driverVersion = (String) capabilities.getCapability(DRIVER_VERSION_CAPABILITY);
        }

        protected File findDefaultExecutable() {
            String homePath = System.getProperty("user.home");
            String executablePath = homePath;

            if (System.getProperty("os.name").toLowerCase().contains("windows")) {
                executablePath += "\\.trueautomation\\bin\\trueautomation.bat";
            } else {
                executablePath += "/.trueautomation/bin/trueautomation";
            }

            if (System.getProperty("trueautomation.executable") == null && new File(executablePath).isFile()) {
                System.setProperty("trueautomation.executable", executablePath);
            }

            return DriverService.findExecutable("trueautomation",
                    "trueautomation.executable", "https://trueautomation.io",
                    "https://trueautomation.io");
        }

        protected ImmutableList<String> createArgs() {
            ImmutableList.Builder<String> argsBuilder = ImmutableList.builder();

            argsBuilder.add("--port");
            argsBuilder.add(Integer.toString(this.getPort()));

            if (this.getLogFile() != null) {
                argsBuilder.add("--log-file");
                argsBuilder.add(this.getLogFile().getAbsolutePath());
            }

            if (this.remote != null) {
                argsBuilder.add("--remote");
            }

            if (this.driver != null && this.driverVersion != null) {
                argsBuilder.add("--driver");
                argsBuilder.add(this.driver);
                argsBuilder.add("--driver-version");
                argsBuilder.add(this.driverVersion);
            }

            return argsBuilder.build();
        }

        protected TrueAutomationService createDriverService(File exe, int port, ImmutableList<String> args,
                                                            ImmutableMap<String, String> env) {
            try {
                return new TrueAutomationService(exe, port, args, env);
            } catch (IOException e) {
                throw new WebDriverException(e);
            }
        }
    }
}
