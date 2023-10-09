const imports = [
  "behaviors.dtsi",
  "dt-bindings/zmk/keys.h",
  "dt-bindings/zmk/bt.h",
  "dt-bindings/zmk/rgb.h",
  "dt-bindings/zmk/backlight.h",
];

const macros = [];
const behaviours = [];

const layers = [];

// prettier-ignore
const template = `
${imports.map((header) => `#include <${header}>`)}

/ {
    macros {
        ${macros.map((m) => {
          return `${m.name}: ${m.name} {
                label = "${m.label}";
                compatible = "zmk,behavior-macro";
                #binding-cells = <0>;
                bindings = ${m.bindings
                  .map((b) => {
                    return `<&macro_${b.macroAction} ${b.macroBinding}>`;
                  })
                  .join(", ")} ;
            };`;
        })}
    };

    behaviors {
        ${behaviours.map((b) => {
          return `${b.name}: ${b.behaviour} {
                compatible = "zmk,${b.compatible}";
                label = "${b.label}";
                #sensor-binding-cells = <2>;
                bindings = ${b.bindings.map((bi) => `<&${bi.action}>`).join(", ")} ;
          };`;
        })}
    }
    
	keymap {
		compatible = "zmk,keymap";

        ${layers.map((layer) => {
          return `${layer.name} {
                bindings = <${layer.bindings.map((bi) => `${bi.action} ${bi.value}`).join(" ")}>;
                sensor-bindings = <${layer.sensors.map(bi => `${bi.behaviour} ${bi.valueOrValues}`).join(" ")}>;
            }`;
        })}
	};
};
`;
