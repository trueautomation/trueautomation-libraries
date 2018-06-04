package io.trueautomation.client.driver;

import org.openqa.selenium.By;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.How;
import org.openqa.selenium.support.PageFactoryFinder;
import org.openqa.selenium.support.pagefactory.Annotations;

import java.lang.annotation.*;
import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.Set;

import static io.trueautomation.client.TrueAutomationHelper.ta;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.TYPE})
@PageFactoryFinder(FindByTA.FindByBuilderTA.class)
public @interface FindByTA {
    String taName() default "";

    How how() default How.UNSET;

    String using() default "";

    String id() default "";

    String name() default "";

    String className() default "";

    String css() default "";

    String tagName() default "";

    String linkText() default "";

    String partialLinkText() default "";

    String xpath() default "";

    public static class FindByBuilderTA extends FindBy.FindByBuilder {
        public By buildIt(Object annotation, Field field) {
            FindByTA findByTA = (FindByTA) annotation;

            String taSelector = findByTA.taName();
            Annotation[] annotations =  field.getDeclaredAnnotations();

            FindBy findBy = (FindBy)findByTA;
            assertValidFindBy(findBy);

            By ans = buildByFromShortFindBy(findBy);
            if (ans == null) {
                ans = buildByFromLongFindBy(findBy);
            }

            return ans;
        }

        protected By buildByFromFindBy(FindByTA findBy) {
            assertValidFindBy(findBy);

            By ans = buildByFromShortFindBy(findBy);
            if (ans == null) {
                ans = buildByFromLongFindBy(findBy);
            }

            return ans;
        }

        protected By buildByFromShortFindBy(FindByTA findBy) {
            if (!"".equals(findBy.className())) {
                return By.className(ta(findBy.className(), findBy.taName()));
            }

            if (!"".equals(findBy.css())) {
                return By.cssSelector(ta(findBy.css(), findBy.taName()));
            }

            if (!"".equals(findBy.id())) {
                return By.id(ta(findBy.id(), findBy.taName()));
            }

            if (!"".equals(findBy.linkText())) {
                return By.linkText(ta(findBy.linkText(), findBy.taName()));
            }

            if (!"".equals(findBy.name())) {
                return By.name(ta(findBy.name(), findBy.taName()));
            }

            if (!"".equals(findBy.partialLinkText())) {
                return By.partialLinkText(ta(findBy.partialLinkText(), findBy.taName()));
            }

            if (!"".equals(findBy.tagName())) {
                return By.tagName(ta(findBy.tagName(), findBy.taName()));
            }

            if (!"".equals(findBy.xpath())) {
                return By.xpath(ta(findBy.xpath(), findBy.taName()));
            }

            // Fall through
            return null;
        }

        protected By buildByFromLongFindBy(FindByTA findBy) {
            return findBy.how().buildBy(ta(findBy.using(), findBy.taName()));
        }

        protected void assertValidFindBys(FindByTA[] findBys) {
            for (FindByTA findBy : findBys) {
                assertValidFindBy(findBy);
            }
        }

        protected void assertValidFindBy(FindByTA findBy) {
            if (findBy.how() != null) {
                if (findBy.using() == null) {
                    throw new IllegalArgumentException(
                            "If you set the 'how' property, you must also set 'using'");
                }
            }

            Set<String> finders = new HashSet();
            if (!"".equals(findBy.using())) finders.add("how: " + findBy.using());
            if (!"".equals(findBy.className())) finders.add("class name:" + findBy.className());
            if (!"".equals(findBy.css())) finders.add("css:" + findBy.css());
            if (!"".equals(findBy.id())) finders.add("id: " + findBy.id());
            if (!"".equals(findBy.linkText())) finders.add("link text: " + findBy.linkText());
            if (!"".equals(findBy.name())) finders.add("name: " + findBy.name());
            if (!"".equals(findBy.partialLinkText()))
                finders.add("partial link text: " + findBy.partialLinkText());
            if (!"".equals(findBy.tagName())) finders.add("tag name: " + findBy.tagName());
            if (!"".equals(findBy.xpath())) finders.add("xpath: " + findBy.xpath());

            // A zero count is okay: it means to look by name or id.
            if (finders.size() > 1) {
                throw new IllegalArgumentException(
                        String.format("You must specify at most one location strategy. Number found: %d (%s)",
                                finders.size(), finders.toString()));
            }
        }

        protected void assertValidFindAll(FindByTA[] findBys) {
            for (FindByTA findBy : findBys) {
                assertValidFindBy(findBy);
            }
        }

    }

}
