# Ruby/RSpec
  For test different branches you need to update **Gemfile**
  
  From local repository: 
      
    gem 'true_automation', path: '<local_path_to_ruby_directory>'
    
  From branch:
  
    gem 'true_automation', git: 'https://github.com/educator-io/trueautomation-libraries', branch: '<branch_name>', glob: 'ruby/true_automation/true_automation.gemspec'

# Java/Maven
For local test need to do
  1. Clone library from repository:
      ```
      git@github.com:educator-io/trueautomation-libraries.git 
      ```
  
  2. Change version in **trueautomation-libraries/java/client/pom.xml**
     ```
     <version>999.0.0</version>
     ```
  
  3. Build artifact **trueautomation-client.jar**
  
  4. Install library
     ```
     mvn install:install-file \
       -Dfile=<path_to_jar_file> \
       -DgroupId=io.trueautomation \
       -DartifactId=trueautomation-client \
       -Dversion=999.0.0 \
       -Dpackaging=jar \
       -DgeneratePom=true
     ``` 
  5. Remove `repositories` node from **pom.xml** file in your project
  
  6. Update `dependency` node with `trueautomation-client` 
     ```
     <dependency>
       <groupId>io.trueautomation</groupId>
       <artifactId>trueautomation-client</artifactId>
       <version>999.0.0</version>
       <scope>system</scope>
       <systemPath>path_to_jar_file</systemPath>
     </dependency>
     ```
