import { ReactNode } from "react";

import { DefaultRootProps } from "@measured/puck";

export type RootProps = {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  title?: string;
  language?: string;
  paddingTop?: string;
  paddingBottom?: string;
} & DefaultRootProps;
function Root({
  header,
  children,
  footer,
  puck,
  language = "ar",
  paddingTop,
  paddingBottom,
}: RootProps) {
  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{ fontFamily: "Tajawal" }}
    >
      {header}
      {/* <Header editMode={puck.isEditing} /> */}
      <div
        className="min-h-512"
        style={{
          paddingTop,
          paddingBottom,
        }}
      >
        {children}
      </div>
      {footer}
      {/* <Footer>
        <Footer.List title="Section">
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
        </Footer.List>
        <Footer.List title="Section">
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
        </Footer.List>
        <Footer.List title="Section">
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
        </Footer.List>
        <Footer.List title="Section">
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
          <Footer.Link href="">Label</Footer.Link>
        </Footer.List>
      </Footer> */}
    </div>
  );
}

export default Root;
