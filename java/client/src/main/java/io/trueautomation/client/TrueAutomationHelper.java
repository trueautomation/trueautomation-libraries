package io.trueautomation.client;

/**
 * TrueAutomationHelper provides provides helper method to use
 * TrueAutomation.IO Smart Locators instead of Selenium locators.
 *
 * To record an element for the first time use TrueAutomationHelper.ta(ta_name, initial_locator) syntax.
 *
 *  *ta_name*         is TrueAutomation Element name. We recommend to use
 *                    namespaced syntax. E.g. _pageName:widgetName:elementName_
 *  *initial_locator* is Selenium locator to use to find element
 *                    for the first time. If you change initial locator in your
 *                    code, TrueAutomation element record will be rewritten
 *                    during next test run.
 * For example:
 *
 *  By.ByXPath(ta('true:automation:name', '//initialXpathLocator'))
 *  By.ByCssSelector(ta('true:automation:name', '.initialCSSSelector'))
 *  By.ByName(ta('true:automation:name', 'Login'))
 *
 */
public class TrueAutomationHelper {
    /**
     * Find previously recorded element from TrueAutomation.IO objects repository
     *
     * @param taName  TrueAutomation.IO Element name.
     * @return        TrueAutomation.IO Locator code
     */
    public static String ta(String taName) {
        return "__taonly__" + taName + "__taonly__";
    }

    /**
     * Find element by Selenium selector and adds to TrueAutomation.IO objects repository if element
     * specified by *taName* parameter is not in TrueAutomation.IO object repository or Selenium locator
     * has been changed since the last run
     *
     * Overwise, finds previously recorded element by *taName*
     *
     * @param taName   TrueAutomation.IO Element name.
     * @param locator  Initial Selenium locator to find element during the first run
     * @return         TrueAutomation.IO Locator code
     */
    public static String ta(String taName, String locator) {
        return locator + "__ta__" + taName + "__ta__";
    }
}
