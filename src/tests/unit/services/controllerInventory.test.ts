import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { controllerInventory } from '@/scripts/controller-inventory.mjs';
const directories: string[] = [];
afterEach(() => { for (const dir of directories.splice(0)) { for (const file of readdirSync(dir)) unlinkSync(path.join(dir,file)); rmdirSync(dir); } });
it('uses controller source, inherited routes, method role restrictions and absolute compatibility aliases',() => {
  const dir = mkdtempSync(path.join(tmpdir(),'frontend-controller-inventory-')); directories.push(dir);
  writeFileSync(path.join(dir,'BaseApiController.cs'),'[Route("api/v1/[controller]")]\npublic abstract class BaseApiController : ControllerBase {}');
  writeFileSync(path.join(dir,'ExampleController.cs'),`[Authorize(Roles = "Parent,Administrator")]
public sealed class ExampleController : BaseApiController {
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public IActionResult Get(int id) => Ok();

    [HttpPost("check")]
    [HttpPost("~/api/v1/compatibility/check")]
    [Authorize(Roles = "Parent")]
    public IActionResult Check() => Ok();
}`);
  const result = controllerInventory(dir);
  expect(result.map(r => [r.method,r.route])).toEqual([['GET','/api/v1/Example/{id}'],['POST','/api/v1/Example/check'],['POST','/api/v1/compatibility/check']]);
  expect(result[0].authorization).toBe('AllowAnonymous');
  expect(result[1].authorization).toContain('Parent,Administrator'); expect(result[1].authorization).toContain('Roles = "Parent"');
  expect(result[2].action).toBe('Check');
});
