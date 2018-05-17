# TrueAutomation

 **true_automation** gem enables awesome TrueAutomation.IO features for Capybara, Watir or Ruby-based Selenium projects. 
    
## Setup

**true_automation** gem provides helper DSL method, that can be used instead of Selenium/Capybara locators. 
Initial setup aim is to make `ta` method visible for your code. 

You need TrueAutomation.IO client installed first.

### MacOS X or Linux

To install it just run the following command in your terminal. Using cURL:

    curl -o- http://trueautomation.io/installer.sh | bash
    
Or using wget

    wget -qO-  http://trueautomation.io/installer.sh | bash
    
Then restart your terminal to start using TrueAutomation.IO

### Windows

Use Windows installer to setup the client. 

### Automatic Setup

Run `trueautomation init` inside your project directory. TrueAutomation installer automatically detects technology used 
in your project. Currently we support Capybara/RSpec automatic setup only. 

#### Capybara/RSpec

For Capybara/RSpec projects TrueAutomation installer adds **true_automation** gem to the Gemfile, includes TrueAutomation
DSL to `rspec_helper.rb` and replaces WebDriver with TrueAutomaton.IO Driver

#### Other

For other Ruby-based stacks installer just adds **true_automation** gem to the Gemfile. Check *Manual Setup* section for 
setup guide.

### Manual Setup

Add this line to your application's Gemfile:

```ruby
gem 'true_automation'
```

And then execute:

    $ bundle install
    
#### Using TrueAutomaton.IO Capybara WebDriver

```ruby
require 'true_automation/driver/capybara'
```

To initialize WebDriver for Capybara
```ruby
TrueAutomation::Driver::Capybara.new(app, port: 9515)
```

#### Controlling TrueAutomation.IO Driver lifecycle

```ruby
require 'true_automation/client'
```

Initialize the client

```ruby
ta_client = TrueAutomation::Client.new
```

Start the client:
```ruby
ta_client.start(port: 9515)
```

Wait until client is started:
```ruby
ta_client.wait_until_start
```

Stop the client:
```ruby
ta_client.stop
```

Client automatically writes the log in `./log/trueautomation-<date-time>.log`

#### Using TrueAutomation.IO locators
    
Add TrueAutomation DSL to your test file

 ```ruby
 require 'true_automation/dsl'
 ```
 
 And include DSL into your class or just as the first line after `require` section.
 
 ```ruby
include TrueAutomation::DSL
```

## Usage

Object is found by initial locator during the first run. We use advanced html tree and attributes analyzing algorithm which can find the object even if locator has been changed (id/classes are regenerated or HTML slightly changed).

The gem provides helper method to use TrueAutomation.IO Smart Locators instead of Selenium or Capybara locators.

To record an element for the first time use `ta(ta_name, initial_locator)` syntax.

| Parameter | Description |
|-----------------|-------------------------------------------------------------|
|*ta_name*        | is TrueAutomation Element name. We recommend to use namespaced syntax. E.g. _pageName:widgetName:elementName_   |
|*initial_locator*| is Selenium/Capybara locator to use to find element for the first time. If you change initial locator in your code, TrueAutomation element record will be rewritten during next test run                                       |

For example:

```ruby
find(:xpath, ta('true:automation:name', '//initialXpathLocator'))
find(:css, ta('true:automation:name', '.initialCSSSelector'))
click(ta('true:automation:name', 'Login'))
```
