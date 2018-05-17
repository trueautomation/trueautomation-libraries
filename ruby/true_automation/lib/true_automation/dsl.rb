require 'true_automation/helpers'

module TrueAutomation
  module DSL
    DSL_METHODS = %i[ta]

    DSL_METHODS.each do |method|
      define_method method do |*args, &block|
        TrueAutomation::Helpers.send method, *args, &block
      end
    end
  end

  extend(TrueAutomation::DSL)
end
