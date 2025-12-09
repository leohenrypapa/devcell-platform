// frontend/src/features/knowledge/KnowledgeAddTextForm.tsx
import React from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

type Props = {
  newTitle: string;
  setNewTitle: (value: string) => void;
  newText: string;
  setNewText: (value: string) => void;
  saving: boolean;
  saveMessage: string | null;
  saveError: string | null;
  onSubmit: () => Promise<void>;
};

const TITLE_RECOMMENDED_MAX = 120;
const TEXT_RECOMMENDED_MIN = 80;

const KnowledgeAddTextForm: React.FC<Props> = ({
  newTitle,
  setNewTitle,
  newText,
  setNewText,
  saving,
  saveMessage,
  saveError,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSubmit();
  };

  const titleLength = newTitle.length;
  const textLength = newText.length;

  return (
    <Card>
      <section aria-label="Add text document to knowledge base">
        <header
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "0.75rem",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Add Text Document
            </h2>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontSize: "var(--dc-font-size-sm)",
                color: "var(--dc-text-muted)",
              }}
            >
              Paste notes, SOPs, or snippets you want indexed into the knowledge
              graph. Great for quick internal documentation.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.25rem",
                }}
              >
                <label
                  htmlFor="kb-title"
                  style={{
                    display: "block",
                    fontSize: "var(--dc-font-size-sm)",
                    fontWeight: 500,
                  }}
                >
                  Title
                </label>
                <span
                  style={{
                    fontSize: "var(--dc-font-size-xs)",
                    color: "var(--dc-text-muted)",
                  }}
                >
                  {titleLength}/{TITLE_RECOMMENDED_MAX}
                </span>
              </div>
              <input
                id="kb-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Example: Malware Dev Onboarding Notes"
                style={{
                  width: "100%",
                  borderRadius: "var(--dc-radius-sm)",
                  border: "1px solid var(--dc-border-subtle)",
                  padding: "0.45rem 0.6rem",
                  fontSize: "var(--dc-font-size-sm)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.25rem",
                }}
              >
                <label
                  htmlFor="kb-text"
                  style={{
                    display: "block",
                    fontSize: "var(--dc-font-size-sm)",
                    fontWeight: 500,
                  }}
                >
                  Text
                </label>
                <span
                  style={{
                    fontSize: "var(--dc-font-size-xs)",
                    color: "var(--dc-text-muted)",
                  }}
                >
                  {textLength} characters
                </span>
              </div>
              <textarea
                id="kb-text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={4}
                placeholder="Paste or type your content here; it will be indexed for RAG queries."
                style={{
                  width: "100%",
                  resize: "vertical",
                  borderRadius: "var(--dc-radius-sm)",
                  border: "1px solid var(--dc-border-subtle)",
                  padding: "0.5rem 0.6rem",
                  fontSize: "var(--dc-font-size-sm)",
                  outline: "none",
                }}
              />
              <p
                style={{
                  marginTop: "0.25rem",
                  marginBottom: 0,
                  fontSize: "var(--dc-font-size-xs)",
                  color: "var(--dc-text-muted)",
                }}
              >
                For best retrieval, aim for at least {TEXT_RECOMMENDED_MIN}{" "}
                characters with a clear topic.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <Button
              type="submit"
              disabled={saving || !newTitle.trim() || !newText.trim()}
            >
              {saving ? "Saving…" : "Save & Index"}
            </Button>
            {saveMessage && !saveError && (
              <span
                style={{
                  fontSize: "var(--dc-font-size-xs)",
                  color: "var(--dc-color-success)",
                }}
              >
                {saveMessage}
              </span>
            )}
          </div>
        </form>

        {saveError && (
          <p
            style={{
              marginTop: "0.5rem",
              color: "var(--dc-color-danger)",
              fontSize: "var(--dc-font-size-sm)",
            }}
          >
            {saveError}
          </p>
        )}
      </section>
    </Card>
  );
};

export default KnowledgeAddTextForm;
