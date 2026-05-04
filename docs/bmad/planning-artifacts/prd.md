---
stepsCompleted:
  - wf-plugin-scan
  - product-reframe
inputDocuments:
  - README.md
  - src/App.tsx
  - src/lib/schema.ts
  - src/lib/store.ts
  - src/lib/layout.ts
  - src/server/routes/files.ts
  - src/server/routes/export.ts
  - /Users/mini/wf-plugin/README.md
  - /Users/mini/wf-plugin/src/skills/wf/SKILL.md
  - /Users/mini/wf-plugin/src/skills/wf/INTERNALS.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/00-overview.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/10-state-machine.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/20-hooks.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/30-scripts.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/50-steps.md
  - /Users/mini/wf-plugin/src/skills/wf/step-registry.json
  - /Users/mini/wf-plugin/src/skills/wf/track-steps.json
  - /Users/mini/wf-plugin/src/skills/wf/helpers.yaml
workflowType: prd
projectName: skill-builder-cc
date: 2026-05-02
---

# Product Requirements Document - Skill Builder CC

## 1. 제품 정의

Skill Builder CC는 기존 스킬을 단순히 시각화하는 도구가 아니다. 사용자가 자기 작업 방식을 문서화하고, step 기반 파이프라인으로 구조화하고, agent harness 위에서 자동화 가능한 **상태관리형 스킬 플랫폼**으로 만들게 해주는 빌더다.

이 제품의 핵심 결과물은 "보기 좋은 workflow diagram"이 아니라, 실제로 agent가 실행할 수 있는 skill package다. 사용자는 UI와 대화를 오가며 step, track, helper, script, state transition, interrupt policy를 설계하고, 빌더는 이를 파일시스템의 스킬 구조로 실시간 반영한다.

## 2. 배경

기존 스킬은 보통 `SKILL.md` 하나로 시작한다. 이 방식은 간단하지만 workflow가 길어지면 문제가 생긴다.

- instruction이 한 파일에 쌓여 context가 비대해진다.
- 반복 가능한 코드를 매번 LLM이 다시 작성하거나 해석한다.
- 지금 어느 단계까지 왔는지 세션 바깥에서 알기 어렵다.
- LLM 응답이 끝났을 때 다음 step으로 이어가게 하는 구조가 없다.
- 자동화를 원해도 LLM이 습관적으로 유저에게 확인 질문을 던진다.
- feature/fix/light/brainstorm처럼 같은 skill 안에서 다른 실행 경로를 만들기 어렵다.

`~/wf-plugin`은 이 문제를 해결한 reference implementation이다. `SKILL.md`는 얇은 entrypoint가 되고, `track-steps.json`, `step-registry.json`, step markdown, helper, runtime shell, `.workflow/state.json`이 함께 하나의 상태관리형 workflow skill을 구성한다.

## 3. 스킬 구조의 진화 모델

Skill Builder는 다음 진화 단계를 자연스럽게 만들 수 있어야 한다.

### Level 1: 단일 파일 스킬

- `SKILL.md`에 역할, trigger, 실행 지침이 모두 들어간다.
- 빠르게 만들 수 있지만 큰 workflow에는 약하다.

### Level 2: 코드 실행을 가진 스킬

- 반복 가능한 명령을 shell/python/node script로 분리한다.
- 단, script는 크게 platform runtime과 user/workflow asset으로 나뉜다.
- user/workflow asset 안에서도 template utility script와 사용자가 직접 만든 domain script는 소유권과 overwrite 정책이 다르다.

### Level 3: Lazy-loaded 다중 파일 스킬

- `SKILL.md`는 "어떻게 시작하고 무엇을 lazy-load할지"만 가진다.
- step별 markdown, helper, internal docs가 별도 파일로 분리된다.
- agent는 필요한 step만 context로 받는다.

### Level 4: 상태관리형 workflow 스킬

- `.workflow/state.json`이 현재 track, current step, step status, produced data를 가진다.
- agent는 다음 step을 추측하지 않고 runtime script가 출력한 step을 따른다.
- `complete-step`, `resume`, `rewind`, `interrupt` 같은 명시적 전이만 허용한다.

### Level 5: Harness-integrated 자동화 스킬

- Stop hook이 workflow 도중 LLM이 멈추는 것을 차단한다.
- UserPromptSubmit hook이 유저 개입을 state에 반영한다.
- 질문 금지 정책과 interrupt 허용 step이 구분된다.
- LLM 출력이 끝나는 본질적 한계는 hook/state/resume loop로 다룬다.

### Level 6: 시각적/대화형 스킬 빌더

- 사용자는 canvas에서 workflow를 편집한다.
- agent와 대화하면서도 같은 skill structure가 실시간으로 바뀐다.
- 이 빌더 자체도 하나의 skill로 실행될 수 있다.

## 4. 제품 목표

1. 사용자가 자신의 업무 자동화 workflow를 상태관리형 skill package로 만들 수 있어야 한다.
2. `SKILL.md`, step files, tracks, helpers, scripts, hooks, state schema의 관계를 시각적으로 이해할 수 있어야 한다.
3. 플랫폼 runtime asset과 사용자 workflow asset을 명확히 구분해야 한다.
4. LLM이 불필요하게 질문하지 않고 계속 진행하도록 no-question/auto-resume 구조를 제공해야 한다.
5. 정말 유저 입력이 필요한 경우에는 interrupt policy와 script를 통해 명시적으로 멈출 수 있어야 한다.
6. UI 편집과 agent 대화 편집이 동일한 파일시스템 truth를 공유해야 한다.
7. 만들어진 skill은 Codex/Claude 같은 agent harness에서 실행 가능해야 한다.

## 5. 비목표

- 단순한 diagramming tool을 만드는 것이 아니다.
- 기존 스킬을 읽기 전용으로 예쁘게 보여주는 것이 핵심 목적이 아니다.
- LLM을 무한히 말하게 만드는 prompt trick이 목적이 아니다.
- 플랫폼 runtime script를 사용자가 매번 직접 설계하게 하지 않는다.
- 모든 workflow를 DAG 엔진으로 일반화하지 않는다. 기본 실행 순서는 track 배열과 state transition으로 충분해야 한다.

## 6. 주요 사용자

### Automation Builder

자기 업무를 반복 가능한 agent workflow로 만들고 싶은 사용자다. 예: 기능 개발, 버그 수정, 문서화, 릴리즈, 리서치, QA.

### Skill Author

다른 사람이 설치해서 쓸 수 있는 스킬 패키지를 만드는 사용자다. runtime 구조, hooks, templates, config, docs까지 고려한다.

### Agent Operator

빌더가 만든 skill을 실제 Codex/Claude 환경에서 실행하는 사용자다. 자동 진행, interrupt, resume, state recovery가 관심사다.

### Workflow Reviewer

workflow가 어디서 자동 진행되고 어디서 멈추는지, 어떤 scripts가 플랫폼 runtime인지 user script인지 검토한다.

## 7. 핵심 개념

### Skill Package

빌더가 생성하고 관리하는 최종 산출물이다.

```text
skill/
  SKILL.md
  step-registry.json
  track-steps.json
  helpers.yaml
  001-setup.md
  030-plan.md
  runtime assets
  user workflow assets
```

### Thin SKILL.md

`SKILL.md`는 모든 지침을 담는 파일이 아니라 entrypoint다. 역할, 시작 방법, halt rule, track 선택 규칙, runtime command만 포함한다.

### Step Registry

`step-registry.json`은 stable step key와 markdown 파일명을 연결한다. step key는 state와 track에서 쓰이는 안정적 식별자다.

### Track

`track-steps.json`은 같은 step pool에서 실행 경로를 나눈다. feature, fix, light, brainstorm처럼 목적별로 step 순서를 다르게 정의한다.

### State

`.workflow/state.json`은 실행 중인 workflow의 단일 진실 소스다.

- `control.*`: runtime script만 바꾸는 상태 머신 영역
- `data.*`: step 실행 중 agent가 전용 script로 기록하는 metadata 영역

### Execution Mode Policy

특정 step은 유저 질문 없이 계속 진행해야 하고, 특정 step은 유저 대화나 백그라운드 대기를 허용해야 한다. 자동화 skill에서 `Solo run` step이 "계획 괜찮나요?" 같은 일반적 확인 질문을 하는 것은 실패 모드다.

### Explicit Interrupt Policy

interrupt는 step별 on/off가 아니라 agent가 필요할 때 실행하는 명시적 runtime command다. `run.sh interrupt "<reason>"` 실행만 state를 interrupted로 바꾼다.

### Runtime Assets vs User Assets

가장 중요한 분리다.

| 분류 | 예시 | 누가 소유하는가 | 사용자가 보통 편집하는가 |
|---|---|---|---|
| Platform runtime | `run.sh`, `lib/init-workflow.sh`, `lib/complete-step.sh`, `lib/resume-workflow.sh`, `stop-guard.sh`, `user-interrupt.sh`, state renderer | Skill Builder/platform | 보통 아님 |
| Workflow utility | `observe-ci.sh`, `observe-reviews.sh`, `check-merge-status.sh` 같은 결정적 step helper | skill author 또는 template | 필요 시 |
| User-authored script | 사용자가 자기 업무를 자동화하려고 추가한 script | 사용자 | 예 |
| Workflow content | step markdown, helpers, track list, skill description | 사용자 | 예 |

폴더명이 `scripts/`라는 이유만으로 같은 범주가 아니다. 빌더는 script의 역할을 metadata로 구분해야 한다.

## 8. 현재 구현 상태

현재 앱은 다음 MVP 기능을 이미 가진다.

- skill folder import
- step, group, track, helper 시각화
- preset 기반 workflow 시작
- step 추가/수정/삭제
- track membership 편집
- interrupt 여부 편집
- helper 추가/수정/삭제
- skill folder export
- React Flow canvas 기반 group/step visualization

하지만 현재 구현은 "기존 skill 폴더를 시각화하고 export하는 편집기" 관점에 가깝다. 제품 목표에 맞추려면 "새 상태관리형 skill을 설계하고 실시간 FS에 반영하는 platform builder"로 중심을 옮겨야 한다.

## 9. 기능 요구사항

### FR-001 새 Stateful Skill 생성

사용자는 빈 상태에서 새 skill package를 만들 수 있어야 한다.

Acceptance Criteria:

- skill name, trigger, description을 입력하면 thin `SKILL.md` 초안이 생성된다.
- 기본 runtime profile을 선택할 수 있다.
- 최소 track, step registry, helpers, runtime assets가 생성된다.

### FR-002 Runtime Profile 선택

사용자는 상태관리형 runtime을 선택할 수 있어야 한다.

Acceptance Criteria:

- 기본 runtime은 `init`, `resume`, `complete`, `interrupt` entrypoint를 제공한다.
- platform runtime assets는 사용자 scripts와 별도 분류된다.
- runtime asset을 수정하려 하면 경고 또는 advanced mode가 필요하다.

### FR-003 Step 설계

사용자는 step을 만들고 markdown 지시사항을 작성할 수 있어야 한다.

Acceptance Criteria:

- step key와 filename은 분리된다.
- step number는 시각 grouping 용도이고 실행 순서는 track 배열이 결정한다.
- step markdown에는 목표, 입력, 행동, 검증, 완료 전이 command가 포함될 수 있다.

### FR-004 Track 설계

사용자는 여러 track을 만들고 step 실행 순서를 정의할 수 있어야 한다.

Acceptance Criteria:

- 같은 step이 여러 track에 들어갈 수 있다.
- track별 순서는 독립적이다.
- 진행 중 workflow의 state와 다음 실행될 template track은 구분된다.

### FR-005 State Schema 설계

사용자는 workflow가 기록할 data field를 정의할 수 있어야 한다.

Acceptance Criteria:

- `control.*`은 platform reserved 영역으로 표시된다.
- `data.*` field는 step output metadata로 정의할 수 있다.
- field별 type, default, producing step, consuming step을 볼 수 있다.

### FR-006 Execution Mode 설계

사용자는 step이 혼자 계속 진행해야 하는지, 유저 대화가 자연스러운지, 백그라운드 대기를 허용해야 하는지를 하나의 실행 모드로 설정할 수 있어야 한다.

Acceptance Criteria:

- 기본 step은 `Solo run`이다.
- `User involved` step은 stop guard가 normal stop을 허용하지만 interrupt state를 자동 변경하지 않는다.
- `Background wait` step은 CI/review/background waiting 중 stop guard가 normal stop을 허용하지만 interrupt state를 자동 변경하지 않는다.
- "ask user", "confirm", "wait for approval" 같은 문구가 `Solo run` step에 있으면 validation warning을 낸다.

### FR-007 Explicit Interrupt Flow 설계

사용자는 agent가 정말 유저 입력을 필요로 할 때 실행할 명시적 interrupt command를 이해할 수 있어야 한다.

Acceptance Criteria:

- stop guard non-blocking set은 `executionMode`에서 파생된다.
- agent가 정말 유저 입력이 필요할 때 실행할 command가 명확히 표시된다.
- interrupt state는 `run.sh interrupt "<reason>"` 실행으로만 기록된다.
- interrupt 종료 후 resume command로 workflow에 복귀한다.

### FR-008 Live Filesystem Sync

빌더에서 설정을 바꾸면 skill folder가 실시간으로 갱신되어야 한다.

Acceptance Criteria:

- UI 변경은 debounced FS write로 반영된다.
- 외부 editor 변경은 watcher가 감지해 UI에 반영한다.
- 충돌 시 어느 쪽 변경이 최신인지 보여준다.
- generated runtime file과 user-authored file의 overwrite 정책이 다르다.

### FR-009 Conversational Editing

사용자는 agent와 대화하면서 skill 구조를 바꿀 수 있어야 한다.

Acceptance Criteria:

- "fix track에 재현 step을 추가해줘"라고 말하면 step, registry, track, canvas가 함께 바뀐다.
- agent가 바꾼 결과는 UI에서 즉시 보인다.
- UI에서 바꾼 결과는 agent가 다음 응답에서 같은 FS state로 읽는다.

### FR-010 Builder-as-a-Skill

Skill Builder 자체도 skill로 실행될 수 있어야 한다.

Acceptance Criteria:

- builder skill 실행 시 로컬 HTML/UI가 열린다.
- builder skill은 현재 편집 중인 skill folder를 context로 가진다.
- agent 대화와 UI가 같은 skill project를 조작한다.

### FR-011 Script Role 관리

사용자는 script를 추가하되 script 역할을 명확히 지정해야 한다.

Acceptance Criteria:

- script role은 platform_runtime, workflow_utility, user_script 중 하나다.
- platform_runtime은 template/runtime upgrade 대상이다.
- user_script는 사용자의 workflow logic으로 보존된다.
- export/import/live sync는 role별 overwrite 정책을 다르게 적용한다.

### FR-012 Validation

빌더는 실행 가능한 skill package인지 검증해야 한다.

Acceptance Criteria:

- track에 없는 step key, registry 누락, helper reference 누락을 잡는다.
- interrupt policy와 step 문구가 충돌하면 warning을 낸다.
- platform runtime file이 누락되면 error를 낸다.
- user script가 step에서 참조되지만 파일이 없으면 error를 낸다.

### FR-013 Reference Workflow Template

`wf-plugin` 같은 full automation template을 seed로 제공해야 한다.

Acceptance Criteria:

- feature/fix/light/brainstorm track이 포함된 template을 만들 수 있다.
- fix track은 reproduction gate를 가진다.
- state machine, stop guard, user interrupt, helper rendering 구조를 포함한다.

## 10. 핵심 사용자 여정

### Journey 1: 내 업무 자동화 skill 만들기

1. 사용자가 Skill Builder skill을 실행한다.
2. 브라우저 UI가 열린다.
3. 사용자가 "새 workflow skill"을 만든다.
4. feature track을 추가한다.
5. step을 여러 개 만든다.
6. 각 step에 agent instruction을 작성한다.
7. execution mode를 기본 `Solo run`으로 둔다.
8. 유저 확인 step은 `User involved`, CI/review 대기 step은 `Background wait`로 지정한다.
9. 빌더가 skill folder를 실시간으로 생성한다.
10. 사용자가 agent harness에서 새 skill을 실행한다.

### Journey 2: 대화로 workflow 구조 변경

1. 사용자가 "fix track에는 반드시 재현 step을 먼저 넣어줘"라고 말한다.
2. agent가 step file을 생성한다.
3. registry에 step key를 추가한다.
4. fix track 배열의 앞쪽에 step을 삽입한다.
5. canvas에서 fix track 구조가 즉시 바뀐다.
6. validation이 통과한다.

### Journey 3: 자동화 중 유저 질문 방지

1. 사용자가 만든 workflow를 실행한다.
2. agent가 current step을 수행한다.
3. agent가 응답을 끝내려 한다.
4. Stop hook이 state를 보고 workflow가 running임을 확인한다.
5. 현재 step이 `Solo run`이면 stop을 block한다.
6. agent는 complete/resume/continue 중 하나를 수행한다.

### Journey 4: 진짜 유저 입력이 필요한 경우

1. step 수행 중 요구사항이 모호하다는 사실이 드러난다.
2. agent가 `interrupt` command를 실행한다.
3. state에 interrupt reason이 기록된다.
4. agent가 유저에게 맥락, 선택지, 추천안을 설명한다.
5. 유저가 답한다.
6. agent가 `resume`으로 workflow에 복귀한다.

### Journey 5: script를 추가하되 역할을 구분하기

1. 사용자가 "릴리즈 노트 생성 script를 추가해줘"라고 한다.
2. 빌더는 이를 user_script 또는 workflow_utility로 분류한다.
3. platform runtime script와 섞이지 않게 표시한다.
4. 해당 step markdown에서 script 호출을 참조한다.
5. export/live sync 시 user script는 보존 대상이 된다.

## 11. 성공 지표

- 사용자가 10분 안에 최소 상태관리형 skill을 만들 수 있다.
- 사용자가 platform runtime script와 user script를 혼동하지 않는다.
- 생성된 skill은 harness에서 `init -> step -> complete -> next step` 흐름으로 실행된다.
- `Solo run` step에서 agent가 불필요한 질문을 하지 않는다.
- interrupt가 필요한 경우 state에 기록되고 resume으로 복귀한다.
- UI와 대화형 편집이 같은 파일시스템 상태를 공유한다.

## 12. 주요 Gap

현재 앱 기준으로 다음이 부족하다.

1. live FS sync가 없다. 현재는 import/export 버튼 중심이다.
2. builder itself as skill 실행 경로가 없다.
3. platform runtime asset과 user script asset의 role 구분이 없다.
4. state schema editor가 없다.
5. no-question policy/interrupt policy validator가 없다.
6. track 실행 순서와 visual group 연결의 의미가 분리되어 있지 않다.
7. manual canvas edge가 저장되지 않는다.
8. generated runtime file overwrite 정책과 user-authored file 보존 정책이 없다.
9. 대화형 agent edit와 UI edit의 동기화 모델이 없다.

## 13. 다음 문서

- Technical Requirements & Design: `docs/bmad/planning-artifacts/trd.md`
- User Scenarios & Test Cases: `docs/bmad/planning-artifacts/user-scenarios-test-cases.md`
