const fs = require('fs');

const navPath = 'frontend/src/components/Navigation.vue';
let content = fs.readFileSync(navPath, 'utf8');

const target = `<Avatar
            v-if="authStore.user"
            :image="userPhotoURL"
            shape="circle"
            class="cursor-pointer"
            @click="toggleUserMenu"
          />`;

const replacement = `<button
            v-if="authStore.user"
            aria-label="User profile menu"
            aria-haspopup="true"
            class="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full cursor-pointer"
            @click="toggleUserMenu"
          >
            <Avatar
              :image="userPhotoURL"
              shape="circle"
            />
          </button>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(navPath, content);
    console.log("Successfully updated Navigation.vue");
} else {
    console.log("Could not find the target string in Navigation.vue");
}
