import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  ApiError,
  AuthRegister,
  AuthRegisterGQL,
  AuthSession,
  GqlErrors,
  parseGqlErrors,
} from '@zen/graphql';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { verticalAccordion } from '../animations';
import { AuthService } from '../auth.service';
import { emailValidator, passwordValidator, usernameValidator } from '../validators';

@Component({
  selector: 'zen-register-form',
  templateUrl: 'zen-register-form.component.html',
  animations: [...verticalAccordion],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZenRegisterFormComponent implements OnDestroy {
  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;
  @Output() registered = new EventEmitter<AuthSession>();

  #subs: Subscription[] = [];
  #usernameTaken = false;
  #emailTaken = false;
  form: FormGroup;
  loading = false;
  generalError = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private auth: AuthService,
    private authRegisterGQL: AuthRegisterGQL
  ) {
    this.form = this.formBuilder.group({
      username: [
        '',
        [Validators.required, this.usernameValidator(), this.usernameTakenValidator()],
      ],
      email: ['', [Validators.required, emailValidator(), this.emailTakenValidator()]],
      password: ['', [Validators.required, this.passwordValidator()]],
      passwordConfirm: ['', [Validators.required, this.passwordConfirmValidator()]],
      acceptTerms: ['', Validators.requiredTrue],
    });

    const sub1 = this.username.valueChanges.subscribe(() => {
      this.#usernameTaken = false;
    });
    this.#subs.push(sub1);

    const sub2 = this.email.valueChanges.subscribe(() => {
      this.#emailTaken = false;
    });
    this.#subs.push(sub2);
  }

  get username() {
    return this.form.get('username') as FormControl;
  }

  get email() {
    return this.form.get('email') as FormControl;
  }

  get password() {
    return this.form.get('password') as FormControl;
  }

  get passwordConfirm() {
    return this.form.get('passwordConfirm') as FormControl;
  }

  get acceptTerms() {
    return this.form.get('acceptTerms') as FormControl;
  }

  usernameTakenValidator(): ValidatorFn {
    return () => {
      if (this.#usernameTaken) return { usernameTaken: true };
      return null;
    };
  }

  usernameValidator(): ValidatorFn {
    return control => {
      if (this.form) return usernameValidator(control);
      return null;
    };
  }

  emailTakenValidator(): ValidatorFn {
    return () => {
      if (this.#emailTaken) return { emailTaken: true };
      return null;
    };
  }

  passwordValidator(): ValidatorFn {
    return control => {
      if (this.form) {
        this.passwordConfirm.updateValueAndValidity();
        return passwordValidator(control);
      }
      return null;
    };
  }

  passwordConfirmValidator(): ValidatorFn {
    return control => {
      if (this.form) {
        const notMatching = control.value && this.password.value !== control.value;
        return notMatching ? { notMatching: true } : null;
      }
      return null;
    };
  }

  onSubmit() {
    if (!this.loading) {
      this.loading = true;
      this.generalError = false;
      this.form.disable();

      this.authRegisterGQL
        .mutate(
          {
            data: {
              username: this.username.value.trim(),
              email: this.email.value.trim(),
              password: this.password.value,
            },
          },
          { fetchPolicy: 'no-cache' }
        )
        .pipe(catchError(parseGqlErrors))
        .subscribe({
          next: ({ data }) => {
            this.loading = false;
            this.registered.emit((<AuthRegister>data).authRegister);
          },

          error: (errors: GqlErrors<ApiError.AuthRegister>) => {
            this.loading = false;
            this.form.enable();

            this.generalError = true;

            if (errors.find(e => e === 'EMAIL_TAKEN')) {
              this.generalError = false;
              this.#emailTaken = true;
              this.email.updateValueAndValidity();
              this.emailInput.nativeElement.select();
            }

            if (errors.find(e => e === 'USERNAME_TAKEN')) {
              this.generalError = false;
              this.#usernameTaken = true;
              this.username.updateValueAndValidity();
              this.usernameInput.nativeElement.select();
            }
          },
        });
    }
  }

  loginWithGoogle() {
    this.loading = true;
    this.form.disable();
    this.auth.loginWithGoogle();
  }

  ngOnDestroy() {
    this.#subs.map(s => s.unsubscribe());
  }
}
