export const htmlEditorStyles = {
  "& p": {
    lineHeight: "24px",
    marginBottom: "10px",
  },
  "& li": {
    lineHeight: "24px",
    marginBottom: "10px",
  },
  "& ul > li": {
    marginLeft: "1em",
  },
  "& ol > li": {
    listStyle: "none",
    counterIncrement: "foo",
    display: "table-row",
  },
  "& ol > li::before": {
    content: 'counter(foo) "."',
    display: "table-cell",
    textAlign: "right",
    paddingRight: ".3em",
  },
  "& ol": {
    counterReset: "foo",
    display: "table",
    marginBottom: "10px",
  },
  "& ul": {
    listStyle: "disc",
  },
};
