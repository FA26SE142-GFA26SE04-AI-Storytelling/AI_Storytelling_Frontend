import { isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeleteAccountSection from '@/app/features/account/DeleteAccountSection';
import { accountService } from '@/app/services/accountService';

// Mock host to execute React state and effects synchronously in Node
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];

  return {
    getDeleteAccountPreview: vi.fn(),
    deleteAccount: vi.fn(),
    logout: vi.fn(async () => {}),
    confirmDialog: vi.fn(async () => true),
    showToast: vi.fn(),
    begin() {
      cursor = 0;
      effects = [];
    },
    commit() {
      effects.forEach((effect) => effect());
    },
    reset() {
      slots.forEach((slot) => slot.cleanup?.());
      slots.length = 0;
      effects = [];
    },
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (slots[index] === undefined) {
        const val = typeof initial === 'function' ? (initial as () => T)() : initial;
        slots[index] = { value: val };
      }
      return [
        slots[index].value as T,
        (next: T | ((current: T) => T)) => {
          slots[index].value =
            typeof next === 'function'
              ? (next as (current: T) => T)(slots[index].value as T)
              : next;
        },
      ] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: { current: initial } };
      return slots[index].value as { current: T };
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous?.deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: effect() || undefined };
        });
      }
    },
    useCallback<T extends (...args: unknown[]) => unknown>(fn: T, deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous?.deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
        slots[index] = { deps, value: fn };
      }
      return (slots[index].value ?? fn) as T;
    },
  };
});

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: host.useState,
  useRef: host.useRef,
  useEffect: host.useEffect,
  useCallback: host.useCallback,
}));

vi.mock('@/app/services/accountService', () => ({
  accountService: {
    getDeleteAccountPreview: host.getDeleteAccountPreview,
    deleteAccount: host.deleteAccount,
  },
}));

vi.mock('@/app/context/AuthContext', () => ({
  useAuth: () => ({
    logout: host.logout,
  }),
}));

vi.mock('@/app/lib/confirm', () => ({
  confirmDialog: host.confirmDialog,
}));

vi.mock('@/app/lib/toast', () => ({
  showToast: host.showToast,
}));

vi.mock('lucide-react', () => ({
  Trash2: () => null,
}));

vi.mock('@/app/components/PasswordInput', () => ({
  default: (props: Record<string, unknown>) => ({
    type: 'input',
    props: {
      ...props,
      type: 'password',
    },
  }),
}));

type Node = { type: unknown; props: Record<string, unknown> };

function nodes(tree: ReactNode, predicate: (node: Node) => boolean): Node[] {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, predicate));
  if (!isValidElement<Record<string, unknown>>(tree)) return [];
  if (typeof tree.type === 'function') {
    const rendered = (tree.type as (props: unknown) => ReactNode)(tree.props);
    return [
      ...(predicate(tree as Node) ? [tree as Node] : []),
      ...nodes(rendered, predicate),
    ];
  }
  return [
    ...(predicate(tree as Node) ? [tree as Node] : []),
    ...nodes(tree.props.children as ReactNode, predicate),
  ];
}

function allText(tree: ReactNode): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree || typeof tree !== 'object') return '';
  if (Array.isArray(tree)) return tree.map(allText).join('');
  if (isValidElement<Record<string, unknown>>(tree)) {
    if (typeof tree.type === 'function') {
      const rendered = (tree.type as (props: unknown) => ReactNode)(tree.props);
      return allText(rendered);
    }
    return allText(tree.props.children as ReactNode);
  }
  return '';
}

function click(node: Node) {
  (node.props.onClick as () => void)();
}

const tick = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

function render() {
  host.begin();
  const tree = DeleteAccountSection();
  host.commit();
  return tree;
}

async function openForm(): Promise<ReactNode> {
  const tree = render();
  const openBtn = nodes(
    tree,
    (n) => n.type === 'button' && allText(n).includes('Xoá'),
  )[0];
  click(openBtn);
  await tick();
  return render();
}

function setInputPassword(tree: ReactNode, value: string) {
  const input = nodes(
    tree,
    (n) => n.props.autoComplete === 'current-password' && typeof n.props.onChange === 'function',
  )[0];
  if (!input) throw new Error('Password input not found');
  (input.props.onChange as (e: { target: { value: string } }) => void)({
    target: { value },
  });
}

function getCheckbox(tree: ReactNode): Node | undefined {
  return nodes(tree, (n) => n.type === 'input' && n.props.type === 'checkbox')[0];
}

function toggleCheckbox(tree: ReactNode, checked: boolean) {
  const cb = getCheckbox(tree);
  if (!cb) throw new Error('Checkbox not found');
  (cb.props.onChange as (e: { target: { checked: boolean } }) => void)({
    target: { checked },
  });
}

function getSubmitButton(tree: ReactNode): Node {
  const btn = nodes(
    tree,
    (n) => n.type === 'button' && n.props.type !== 'button' && allText(n).includes('Xoá'),
  )[0];
  if (!btn) throw new Error('Submit button not found');
  return btn;
}

async function submitForm(tree: ReactNode): Promise<void> {
  const form = nodes(tree, (n) => n.type === 'form')[0];
  if (!form) throw new Error('Form not found');
  await (form.props.onSubmit as (e: { preventDefault: () => void }) => Promise<void>)({
    preventDefault: () => {},
  });
  await tick();
}

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    host.confirmDialog.mockResolvedValue(true);
    host.deleteAccount.mockResolvedValue({ success: true, message: 'OK', data: null });
  });

  afterEach(() => {
    host.reset();
    vi.clearAllMocks();
  });

  it('1. Preview không có hồ sơ bé (childProfiles: []): bấm nút "Xoá" để mở form, nhập mật khẩu → nút Xoá (submit) bật; không có checkbox "Xoá cả"', async () => {
    vi.spyOn(accountService, 'getDeleteAccountPreview').mockResolvedValue({
      success: true,
      message: 'OK',
      data: { childProfiles: [] },
    } as never);

    let tree = render();
    const openBtn = nodes(
      tree,
      (n) => n.type === 'button' && allText(n).includes('Xoá'),
    )[0];
    click(openBtn);
    await tick();
    tree = render();

    expect(allText(tree)).not.toContain('Xoá cả');
    expect(getCheckbox(tree)).toBeUndefined();

    setInputPassword(tree, 'mypassword123');
    tree = render();

    const submitBtn = getSubmitButton(tree);
    expect(submitBtn.props.disabled).toBe(false);
  });

  it('2. Preview có 2 hồ sơ bé: tên hiển thị, có checkbox "Xoá cả 2 hồ sơ bé"; nhập mật khẩu chưa tick → disabled; tick → bật', async () => {
    vi.spyOn(accountService, 'getDeleteAccountPreview').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        childProfiles: [
          { id: 1, nickname: 'Na', status: 'Active' },
          { id: 2, nickname: 'Bo', status: 'Draft' },
        ],
      },
    } as never);

    let tree = await openForm();
    const text = allText(tree);
    expect(text).toContain('Na');
    expect(text).toContain('Bo');
    expect(text).toContain('Đang hoạt động');
    expect(text).toContain('Chưa kích hoạt');
    expect(text).toContain('Xoá cả 2 hồ sơ bé');

    const cb = getCheckbox(tree);
    expect(cb).toBeDefined();

    setInputPassword(tree, 'mypassword123');
    tree = render();

    let submitBtn = getSubmitButton(tree);
    expect(submitBtn.props.disabled).toBe(true);

    toggleCheckbox(tree, true);
    tree = render();

    submitBtn = getSubmitButton(tree);
    expect(submitBtn.props.disabled).toBe(false);
  });

  it('3. Gọi xoá với hồ sơ bé đã tick: deleteAccount được gọi với (password, true)', async () => {
    vi.spyOn(accountService, 'getDeleteAccountPreview').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {
        childProfiles: [{ id: 1, nickname: 'Na', status: 'Active' }],
      },
    } as never);

    let tree = await openForm();
    setInputPassword(tree, 'secretPass123');
    tree = render();

    toggleCheckbox(tree, true);
    tree = render();

    await submitForm(tree);

    expect(accountService.deleteAccount).toHaveBeenCalledWith('secretPass123', true);
    expect(host.logout).toHaveBeenCalled();
  });

  it('4. Gọi xoá không có hồ sơ bé: deleteAccount được gọi với (password, false)', async () => {
    vi.spyOn(accountService, 'getDeleteAccountPreview').mockResolvedValue({
      success: true,
      message: 'OK',
      data: { childProfiles: [] },
    } as never);

    let tree = await openForm();
    setInputPassword(tree, 'secretPass456');
    tree = render();

    await submitForm(tree);

    expect(accountService.deleteAccount).toHaveBeenCalledWith('secretPass456', false);
    expect(host.logout).toHaveBeenCalled();
  });

  it('5. Preview trả về thiếu childProfiles (data = {}): không crash, coi như không có hồ sơ; nút Xoá bật sau khi nhập mật khẩu', async () => {
    vi.spyOn(accountService, 'getDeleteAccountPreview').mockResolvedValue({
      success: true,
      message: 'OK',
      data: {},
    } as never);

    let tree = await openForm();
    expect(allText(tree)).not.toContain('Xoá cả');
    expect(getCheckbox(tree)).toBeUndefined();

    setInputPassword(tree, 'mypassword789');
    tree = render();

    const submitBtn = getSubmitButton(tree);
    expect(submitBtn.props.disabled).toBe(false);
  });
});
