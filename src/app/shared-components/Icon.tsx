import * as FontAwesomeIcons from "react-icons/fa";
import * as FontAwesomeIcons6 from "react-icons/fa6";
// import * as MaterialDesignIcons from "react-icons/md";
// import * as RemixIcons from "react-icons/ri";
// import * as IonIcons from "react-icons/io5";
// import * as GroomIcons from "react-icons/gr";
// import * as HiIcons from "react-icons/hi";
// import * as BsIcons from "react-icons/bs";

export const iconTypes = [
  { title: "FontAwesome", value: "fa" },
  { title: "FontAwesome6", value: "fa6" },
  // { title: "MaterialDesign", value: "md" },
  // { title: "Remix", value: "ri" },
  // { title: "IonIcons", value: "ii" },
  // { title: "GroomIcons", value: "gr" },
  // { title: "HiIcons", value: "hi" },
  // { title: "BsIcons", value: "bs" },
];

export const getIconTypeIcons = (type: string) => {
  switch (type) {
    case "fa": {
      return FontAwesomeIcons;
    }
    case "fa6": {
      return FontAwesomeIcons6;
    }
    // case "md": {
    //   return MaterialDesignIcons;
    // }
    // case "ri": {
    //   return RemixIcons;
    // }
    // case "ii": {
    //   return IonIcons;
    // }
    // case "hi": {
    //   return HiIcons;
    // }
    // case "gr": {
    //   return GroomIcons;
    // }
    // case "bs": {
    //   return BsIcons;
    // }
  }
};

const Icon = ({
  type,
  name,
  size = "1.2em",
  ...props
}: {
  type: string;
  name: string;
  size?: string;
  className?: string;
}) => {
  let src: any = FontAwesomeIcons;
  switch (type) {
    case "fa": {
      src = FontAwesomeIcons;
      break;
    }
    case "fa6": {
      src = FontAwesomeIcons6;
      break;
    }
    // case "md": {
    //   src = MaterialDesignIcons;
    //   break;
    // }
    // case "ri": {
    //   src = RemixIcons;
    //   break;
    // }
    // case "ii": {
    //   src = IonIcons;
    //   break;
    // }
    // case "hi": {
    //   src = HiIcons;
    //   break;
    // }
    // case "gr": {
    //   src = GroomIcons;
    //   break;
    // }
    // case "bs": {
    //   src = BsIcons;
    //   break;
    // }
    default: {
      console.log(
        "icon type of name is not supported. Check https://react-icons.github.io/react-icons/ for reference.",
      );
      return <></>;
    }
  }
  const I = src[name];
  if (!I) return <></>;
  return <I {...props} size={size} />;
};

export default Icon;
