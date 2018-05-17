module TrueAutomation
  ##
  #
  # TrueAutomation::Helpers class provides helper method to use
  # TrueAutomation.IO Smart Locators instead of Selenium or Capybara locators.
  #
  # To record an element for the first time use ta(ta_name, initial_locator) syntax.
  #
  #  *ta_name*         is TrueAutomation Element name. We recommend to use
  #                    namespaced syntax. E.g. _pageName:widgetName:elementName_
  #  *initial_locator* is Selenium/Capybara locator to use to find element
  #                    for the first time. If you change initial locator in your
  #                    code, TrueAutomation element record will be rewritten
  #                    during next test run.
  # For example:
  #
  #  find(:xpath, ta('true:automation:name', '//initialXpathLocator'))
  #  find(:css, ta('true:automation:name', '.initialCSSSelector'))
  #  click(ta('true:automation:name', 'Login'))
  #
  class Helpers

    ##
    #
    # @return [String] TrueAutomation.IO locator
    #
    def self.ta(name, locator = '')
      if !locator.empty?
        "#{locator}__ta__#{name}__ta__"
      else
        "__taonly__#{name}__taonly__"
      end
    end
  end
end
